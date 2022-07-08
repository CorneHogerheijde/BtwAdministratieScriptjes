# VATAdministrationScripts
Google Apps Scripts for use together with Google Document AI for automating your VAT/Tax administration. Since this is a small hobby project without any significant time investment (free afternoon work) this is probably 'bad' code and can be improved a lot. So; please do so and let me know! 

## TODO: Add scripts to match bank account export data

## Prerequisites
- A Google Drive folder
- A base folder to contain your files
- A folder structure  like below:
  - 2022 - Q1
  - 2022 - Q2
  - 2022 - Q3
  - etc.


## Steps to get it working

1. Upload your administration (pdf/jpg/...) to a Google Drive folder. This can be any invoice document containing a total price, VAT and/or net price, or just a photo from the receipt.
2. Create a new project at https://script.google.com
3. Add the 3 script files from this repo
4. Create a new project at https://console.cloud.google.com/ and set up Document AI API
    - Follow instructions here: https://cloud.google.com/document-ai/docs/setup?hl=en
    - Follow the instructions to create a service account and download the private key file
5. Download the private key, and fill all the variables in docAPI.gs script (TODO: improve!)
6. Follow instructions here to create a processor: https://cloud.google.com/document-ai/docs/create-processor
    - Use "Invoice Parser"
7. Ensure the correct base folder is set in runOcrDocumentAIApi.gs script
8. Run the script!


**Please update this steps when any problems found. Especially authorization of the service account didn't work immediately for me.**

And of course, custimize the createSheet.gs as you wish! (Currently this script outputs a template I use for copy/paste)
