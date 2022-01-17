# dfk-tavern-direct
 A direct way to access the DefiKingdoms query without having to wait for the full 3 day sync interval.
 
**If you like this project, please consider supporting future developments with a donation to 0x0dB6778807f5Df9feEe087E4600b970eFE3b46F8**

# Disclaimer
This app is provided as is. Please use at your own risk! (We will not be liable for any bugs, errors etc.)

# Developers: How to Use
Buying a hero needs your wallet's private key. I did not have the time to integrate Metamask, so the app asks you for it, sorry, if I'd had more time I too would have preferred to integrate it already, but time did not permit it. So: Read the code, make sure that you really trust it (it is short enough and you can use the query features without entering your secret phrase). Then and only then: Open the dist/index2.html  file in your Chrome browser (did not verify functionality in other browsers). In case you modify anything in the src/index.js: run npm i and npx webpack to update dist/main.js.

# Thanks
A big thank you to MrZipper who provided the ABIs for this project. Check out his repository at https://github.com/0rtis/dfk !
