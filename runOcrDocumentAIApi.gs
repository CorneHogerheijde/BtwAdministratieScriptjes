function runOcrDocumentAIApi() {
  var now = new Date();
  
  var folderBase = "Corne/ZZP/Facturen";

  var quarter = Math.floor(now.getMonth() / 3);
  var year = now.getFullYear();

  if(quarter == 0.0) {
    year = year - 1;
    quarter = 4;
  }
  var quartername = `${year} - Q${quarter}`;
  var folderName = `${folderBase}/${quartername}`;
  Logger.log(folderName);
  var folder = getDriveFolderFromPath(folderName);

  var pdfResults = getFileInformations (folder, "application/pdf");
  var jpgResults = getFileInformations (folder, "image/jpeg");

  var results = pdfResults.concat(jpgResults); //.sort((a,b) => isNaN(Date.parse(a)) || isNaN(Date.parse(b)) ? -1 : new Date(a) - new Date(b));

  createSheet(folderBase, quartername, results);
  Logger.log("Finished!");
}

function runOcrDocumentAIFullYear() {
  var now = new Date();
  
  var folderBase = "Corne/ZZP/Facturen";

  var year = "2022";
  var results = [];

  for(var i = 1; i < 5; i++)
  {
    var quartername = `${year} - Q${i}`;
    var folderName = `${folderBase}/${quartername}`;
    Logger.log(folderName);
    var folder = getDriveFolderFromPath(folderName);

    var pdfResults = getFileInformations (folder, "application/pdf");
    var jpgResults = getFileInformations (folder, "image/jpeg");

    results.push(pdfResults.concat(jpgResults));
  }

  createSheet(folderBase, year, results);
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

function getDriveFolderFromPath (path) {
  return (path || "/").split("/").reduce ( function(prev,current) {
    if (prev && current) {
      var fldrs = prev.getFoldersByName(current);
      return fldrs.hasNext() ? fldrs.next() : null;
    }
    else {
      return current ? null : prev;
    }
  },DriveApp.getRootFolder());
}
