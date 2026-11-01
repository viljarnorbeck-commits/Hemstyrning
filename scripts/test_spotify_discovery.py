"""State regression: absent announcements must not masquerade as available."""
import importlib.util
from pathlib import Path
import unittest
import json
from io import BytesIO
from unittest.mock import patch
from urllib.parse import parse_qs

spec = importlib.util.spec_from_file_location('discovery', Path(__file__).with_name('spotify-discovery.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class DiscoveryTest(unittest.TestCase):
    def test_activation_checks_identity_and_sends_only_to_discovered_endpoint(self):
        devices = module.Devices()
        devices.rows['speaker'] = {'id': 'receiver', 'name': 'Test speaker', 'announced': True}
        devices.endpoints['receiver'] = ('http://192.168.0.50:8200/zc', 'hardware-id')
        calls = []
        class Opener:
            def open(self, request, **kwargs):
                calls.append(request)
                if isinstance(request, str):
                    return BytesIO(json.dumps({'deviceID': 'hardware-id', 'tokenType': 'accesstoken', 'clientID': 'receiver-client', 'version': '2.10.0'}).encode())
                return BytesIO(b'{"status":101}')
        try:
            with patch.object(module, 'build_opener', return_value=Opener()):
                self.assertEqual(devices.activate('receiver', 'test-token', 'test-user'), 'hardware-id')
            self.assertEqual(calls[1].full_url, 'http://192.168.0.50:8200/zc')
            body = parse_qs(calls[1].data.decode())
            self.assertEqual(body['action'], ['addUser'])
            self.assertEqual(body['blob'], ['test-token'])
            self.assertNotIn('test-token', json.dumps(devices.snapshot()))
        finally:
            devices.probes.shutdown()

    def test_activation_never_logs_out_another_user_or_posts_to_changed_identity(self):
        devices = module.Devices()
        devices.rows['speaker'] = {'id': 'receiver', 'name': 'Test speaker', 'announced': True}
        devices.endpoints['receiver'] = ('http://192.168.0.50:8200/zc', 'hardware-id')
        try:
            for info in [
                {'deviceID': 'other-id', 'tokenType': 'accesstoken'},
                {'deviceID': 'hardware-id', 'tokenType': 'default'},
                {'deviceID': 'hardware-id', 'tokenType': 'accesstoken', 'activeUser': 'another-user'},
            ]:
                calls = []
                class Opener:
                    def open(self, request, **kwargs):
                        calls.append(request)
                        return BytesIO(json.dumps(info).encode())
                with patch.object(module, 'build_opener', return_value=Opener()):
                    with self.assertRaises(ValueError):
                        devices.activate('receiver', 'test-token', 'test-user')
                self.assertEqual(len(calls), 1)
        finally:
            devices.probes.shutdown()

    def test_idle_receiver_and_removal(self):
        devices = module.Devices()
        class Info:
            decoded_properties = {'fn': 'HT-A9', 'md': 'HT-A9'}
        class FakeZc:
            def get_service_info(self, *_args, **_kwargs):
                return Info()
        kind = module.TYPES[1]
        name = 'receiver.' + kind
        devices.add_service(FakeZc(), kind, name)
        snapshot = devices.snapshot()
        self.assertTrue(snapshot['readOnly'])
        self.assertEqual(snapshot['devices'][0]['name'], 'HT-A9')
        self.assertTrue(snapshot['devices'][0]['announced'])
        devices.remove_service(None, kind, name)
        self.assertFalse(devices.snapshot()['devices'][0]['announced'])
        self.assertTrue(snapshot['devices'][0]['announced'])
        devices.probes.shutdown()

    def test_unresolved_advertisement_not_added(self):
        devices = module.Devices()
        class FakeZc:
            def get_service_info(self, *_args, **_kwargs):
                return None
        devices.add_service(FakeZc(), module.TYPES[1], 'unresolved')
        self.assertEqual(devices.snapshot()['devices'], [])
        devices.probes.shutdown()


if __name__ == '__main__':
    unittest.main()
