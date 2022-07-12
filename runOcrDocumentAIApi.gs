function runOcrDocumentAIApi() {
  var now = new Date();
  
  var folderBase = "##YOUR BASE FOLDER HERE!##" // Format e.g.: Administration/Invoices
  
  var quarter = `${now.getFullYear()} - Q${Math.floor(now.getMonth() / 3)}`
  var folderName = `${folderBase}/${quarter}`;
  var folder = getDriveFolderFromPath(folderName);

  var pdfResults = getFileInformations (folder, "application/pdf");
  var jpgResults = getFileInformations (folder, "image/jpeg");

  var results = pdfResults.concat(jpgResults); //.sort((a,b) => isNaN(Date.parse(a)) || isNaN(Date.parse(b)) ? -1 : new Date(a) - new Date(b));

  createSheet(folderBase, quarter, results);
  Logger.log("Finished!");
}

function getFileInformations (folder, mimeType) {
  var results = [];
  //Find all images in folder
  var images = folder.getFilesByType(mimeType);

  while (images.hasNext()) {
   
    var image = images.next();

    Logger.log("Name: " + image.getName());

    try{
      var docBytes = Utilities.base64Encode(image.getBlob().getBytes());
      var response = processDocument(docBytes, mimeType);
      var result = processResponse(response, image);

      Logger.log(result);
      results.push(result);
    } catch(ex) {
      Logger.log(ex);
      results.push({
        btw_percentage: null,
        btw_totaal: null,
        totaalprijs: null,
        nettoprijs: null,
        datum: null,
        image: image
      });
    }
  }
    
  return results;
}

function processResponse(response, image) {
  var result = {
    btw_percentage: null,
    btw_totaal: null,
    totaalprijs: null,
    nettoprijs: null,
    datum: null,
    image: image
  };

  if(!response.document || !response.document.entities){
    Logger.log("Error in document!");
    Logger.log(response);
    return result;
  }
  response.document.entities.forEach(entity => {
    //Logger.log(`entity: ${entity.confidence}, ${entity.type}: ${entity.mentionText}`);

    if(entity.type == "vat") {
      entity.properties.forEach(prop => {
        //Logger.log(`=> prop: ${prop.confidence}, ${prop.type}: ${prop.mentionText}`);

        if(prop.type == "vat/tax_rate"){
          result.btw_percentage = prop.mentionText;
        }
        if(prop.type == "vat/tax_amount"){
          result.btw_totaal = prop.mentionText;
        }
      });
    }

    if(entity.type.search(/inc(.*?)btw/gi) > 0){
      result.totaalprijs = entity.mentionText;
    }

    if(entity.type == "invoice_date") {
      var dateText = entity.normalizedValue ? entity.normalizedValue.text : entity.mentionText;

      if(isNaN(Date.parse(dateText))){
        result.datum = dateText;
      }else {
        var date = new Date(dateText);
        result.datum = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      }        
    }

    if(entity.mentionText.search(/abonnementskosten/gi)>0){
      entity.properties.forEach(prop => {
        if(prop.type.search("amount")>0){
          result.totaalprijs = prop.mentionText;
        }
      });
    }

    if(entity.type == "total_amount"){
      result.totaalprijs = entity.mentionText;
    }

    if(entity.type == "net_amount"){
      result.nettoprijs = entity.mentionText;
    }
    if(entity.type == "total_tax_amount"){
      result.btw_totaal = entity.mentionText;
    }
  });
  
  return result;
}
