# crypto

Test crypto repo, idea for a secure communication meshnet running on WebRTC.  Could potentially be embedded in arbitrary websites to increase the available security / network participation.

Allows for third-parties to know that a computer is using the particular system (like TOR), but nothing else.  Severely limits the kind of information able to be passed in order to maintain performance and security guarantees.

All clients loop through sending messages to certain "slots", say slot 0 to slot 99.  A slot represents a subset of users (think mod of key).  Message packets all have a fixed size (with added random padding) and a fixed interval of transmission.  This obfuscates whether or not a particular message is "real" or not or whether a system is actively sending a new "real message" or just automatically-generated messages
