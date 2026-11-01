"""State regression: absent announcements must not masquerade as available."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('discovery', Path(__file__).with_name('spotify-discovery.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class DiscoveryTest(unittest.TestCase):
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
