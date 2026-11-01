Spotify work from the separate chat, saved for handoff.

These two Git patches contain only the changes authored in that chat:
1. baf8ab2: local Spotify Connect / Cast discovery and app integration.
2. f6a269e: move devices into the existing output picker, prefer Spotify Connect over Cast duplicates, and use receiver-reported Spotify IDs.

Original parent: 98e9dc8 (local Hemstyrning history).
Apply in order on that parent or a compatible later checkout with git am.
The original local commits and earlier work remain preserved in the Windows checkout.
No account files, tokens, local configuration or other unpublished commits are included.

Known limitation: playback activation is NOT fixed. A real HT-A9 transfer with play=false returned Spotify 404 Device not found. Listing a receiver does not activate it for the account. Tests for merging and chooser behavior passed; wider pre-existing test suites contain failures. Do not treat this handoff as a fully verified playback implementation.
