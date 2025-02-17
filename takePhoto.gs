function linkImagesToSheet() {
  const mainFolderId = 'KlasorId'; // Ana klasörün ID'sini buraya girin
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Option");
  const studentData = {}; // Öğrenci numarası ve resim linkini eşlemek için

  // Ana klasördeki tüm dosya ve alt klasörleri taramak için özyinelemeli fonksiyon
  function scanFolder(folder) {
    const files = folder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      const fileName = file.getName();
       
      // Dosya adı "21-Barış-Bozkurt.jpg" formatında olmalı
      const [studentNo] = fileName.split('-'); // İlk bölüm öğrenci numarası
      
      // Thumbnail formatında Google Drive linkini oluştur
      const fileId = file.getId();
      const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
      studentData[studentNo] = thumbnailUrl; // Öğrenci numarası ve linki eşleştir
    }
    
    // Alt klasörleri tarar
    const subFolders = folder.getFolders();
    while (subFolders.hasNext()) {
      scanFolder(subFolders.next()); // Alt klasörleri özyinelemeli olarak çağırır
    }
  }

  // Ana klasörden taramayı başlat
  const mainFolder = DriveApp.getFolderById(mainFolderId);
  scanFolder(mainFolder);

  // "Option" sayfasına linkleri ekler
  const lastRow = sheet.getLastRow();
  for (let row = 2; row <= lastRow; row++) { // Başlık varsa 2. satırdan başlar
    const studentNo = sheet.getRange(row, 1).getValue().toString(); // 1. sütun: öğrenci no
    if (studentData[studentNo]) {
      sheet.getRange(row, 4).setValue(studentData[studentNo]); // 4. sütun: resim linki
    }
  }
}