function createSheet(folderBase, quarter, results) {
  //Set up spreadsheet
  var sheetFolder = getDriveFolderFromPath(folderBase);
  var resource = {
    title: `${quarter} - btw-results (${new Date().getMonth()+1}).xlsx`,
    mimeType: MimeType.GOOGLE_SHEETS,
    parents: [{ id: sheetFolder.getId() }]
  }
  var fileJson = Drive.Files.insert(resource)
  var sheetId = fileJson.id

  var ss = SpreadsheetApp.openById(sheetId);
  SpreadsheetApp.setActiveSpreadsheet(ss);
  Logger.log('File name: ' + ss.getName());
  var sheet = SpreadsheetApp.getActiveSheet();
  sheet.clear();

  // Header row
  sheet.appendRow(["Datum", "Omschrijving", "Autokosten J/N","Factuurbedrag incl. BTW", "BTW percentage", "BTW bedrag", "Netto?", "Filelink Google Drive"]);

  results.forEach(result => {
    var filename = result.image.getName();
    var url = result.image.getUrl();
    var drivelink = '=HYPERLINK("' + url +'"; "' + filename + '")';
    var filelink = `=HYPERLINK("${quarter}\\${filename}"; "${filename}")`; // foldername\filename.ext

    // fix btw_percentage
    if(result.btw_percentage != "21" && result.btw_percentage != "9" && result.btw_percentage != "0"){
      result.btw_percentage = "21%"; // just guess
    } else if(result.btw_percentage) {
      result.btw_percentage = result.btw_percentage + "%"
    }

    var row=sheet.getLastRow()+1;

    if(result.totaalprijs && result.totaalprijs.search(/,/gi) > 0 && result.totaalprijs.search(/\./gi) > 0){ // if both "." and "," exist, replace the dot
      result.totaalprijs = result.totaalprijs.replace(".","");
    }

    result.totaalprijs = result.totaalprijs ? result.totaalprijs.replace(".", ",") : "";
    result.btw_totaal = result.btw_totaal ? result.btw_totaal.replace(".",",") : `=D${row}*(IF(E${row}=21%;21;9)/(IF(E${row}=21%;21;9)+100 ))`;
    result.nettoprijs = result.nettoprijs ? result.nettoprijs.replace(".", ",") : `=D${row}-F${row}`;

    sheet.appendRow([result.datum || "", filelink || "", "Nee", result.totaalprijs, result.btw_percentage || "", result.btw_totaal, result.nettoprijs, drivelink || ""]);
  });

  // Add empty formula row
  var row=sheet.getLastRow()+1;
  sheet.appendRow(["","Lege formules.","","totaal?","",`=D${row}*(IF(E${row}=21%;21;9)/(IF(E${row}=21%;21;9)+100 ))`,`=D${row}-E${row}`,"",""]);

}


/**
 * 
 * var result = {
    btw_percentage: null,
    btw_totaal: null,
    totaalprijs: null,
    nettoprijs: null,
    datum: null,
    image: image
  };
 * 
 */
