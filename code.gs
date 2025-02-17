const TOKEN = 'Buraya Token Yazılacak.';  // Buraya kendi bot token'ınızı yazın
const CHAT_ID = 'Buraya Chat Id Yazılacak.';  // Buraya grup chat ID'sini yazın

function doGet(e) {
  return HtmlService.createTemplateFromFile("Index").evaluate()
    .setTitle("Kitap İşlemleri")
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getStudents() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Option');
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();
  var students = data.map(function(row) {
    return { no: row[0], adSoyad: row[2]};
  });
  return students;
}

function getBooks() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Kitaplar');
  var data = sheet.getRange(2, 5, sheet.getLastRow() - 1, 4).getValues();
  var books = data.map(function(row) {
    return { kitapGrubu: row[0], kitapTuru: row[1], kitapAdi: row[2], kitapSayfa: row[3]};
  });
  return books;
}
function getGrupTur() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Option');
  var data = sheet.getRange(2, 6, 132, 2).getValues();
  console.log(data);
  var grupTur = data
    .filter(function (row) {
      return row[0] && row[1]; // Boş olmayan satırları kontrol et
    })
    .map(function (row) {
      return { grup: row[0], tur: row[1]};
    });
  return grupTur;
}
function saveLateData(studentData) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Kitaplar');
  var sheet2 = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('KitaplarYedek');
  var today = new Date();

  // Tarihi GG.AA.YYYY formatında oluştur
  var day = String(today.getDate()).padStart(2, '0'); // Gün
  var month = String(today.getMonth() + 1).padStart(2, '0'); // Ay
  var year = today.getFullYear(); // Yıl
  var formattedDate = `${day}.${month}.${year}`;

  // Mevcut verileri al
  var existingData = sheet.getDataRange().getValues();
   var answer = { success: false, message: "İşlem başarısız oldu." }; // Başlangıçta başarısız kabul et


  studentData.forEach(function (student) {
    if (sifreKontrol(student.no, student.sifre)) {
      var isUpdated = false;
      var isDublicated = false;

      // Mevcut verilerde kontrol ve güncelleme
      for (var i = 0; i < existingData.length; i++) {
        var row = existingData[i];
        var [
          existingDate,
          existingNo,
          existingSifre,
          existingClass,
          existingKitapGrubu,
          existingKitapTuru,
          existingKitapAdi,
          existingKitapSayfasi,
        ] = row;
        if (
          existingNo == student.no &&
          existingSifre == student.sifre &&
          existingClass == getStudentClass(student.no) &&
          existingKitapGrubu == student.kitapGrubu &&
          existingKitapTuru == student.kitapTuru &&
          existingKitapAdi == dogruYazim(student.kitapAdi) &&
          existingKitapSayfasi == student.kitapSayfasi
        ) {
          isUpdated = true; // Aynı veri bulundu
          isDublicated = true;
          answer = { success: true, message: "Bu kitap zaten mevcut." };
          break;
        }
        // Eğer KitapAdi aynı ise güncelle
        else if (
          existingNo == student.no &&
          existingKitapAdi == dogruYazim(student.kitapAdi)
        ) {
          sheet.getRange(i + 1, 1, 1, 8).setValues([
            [
              formattedDate, // Tarihi güncelle
              student.no,
              student.sifre,
              getStudentClass(student.no),
              student.kitapGrubu,
              student.kitapTuru,
              dogruYazim(student.kitapAdi),
              student.kitapSayfasi,
            ],
          ]);
          isUpdated = true; // Güncelleme yapıldı
          answer = { success: true, message: "Kitap başarıyla güncellendi." };
          break;
        }
      }

      // Eğer güncelleme yapılmadıysa yeni kayıt ekle
      if (!isUpdated) {
        sheet.appendRow([
          formattedDate,
          student.no,
          student.sifre,
          getStudentClass(student.no),
          student.kitapGrubu,
          student.kitapTuru,
          dogruYazim(student.kitapAdi),
          student.kitapSayfasi,
        ]);
        var message = student.no + " -- " + getStudentName(student.no)  +" -- " + dogruYazim(student.kitapAdi);
        sendMessageToTelegram(message);
        answer = { success: true, message: "Kitap başarıyla kaydedildi." };
      }

      // `sheet2` tablosuna her zaman ekle
      if(!isDublicated){
        sheet2.appendRow([
        formattedDate,
        student.no,
        student.sifre,
        getStudentClass(student.no),
        student.kitapGrubu,
        student.kitapTuru,
        dogruYazim(student.kitapAdi),
        student.kitapSayfasi,
      ]);
      }

    }
  });

  return answer;
}

function getStudentClass(studentNo){
  donen = ""
  var optionSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Option")
  const sifreler = optionSheet.getRange(2,1,optionSheet.getLastRow()-1,4).getValues();
  for (var i =0;i<sifreler.length;i++){
    if(sifreler[i][0]==studentNo){
      donen = sifreler[i][3]
      return donen
    }
  }
  return donen 
}

function getStudentName(studentNo){
  donen = ""
  var optionSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Option")
  const sifreler = optionSheet.getRange(2,1,optionSheet.getLastRow()-1,4).getValues();
  for (var i =0;i<sifreler.length;i++){
    if(sifreler[i][0]==studentNo){
      donen = sifreler[i][2]
      return donen
    }
  }
  return donen 
}

function dogruYazim(metin) {
  // Özel karakterleri temizle
  const ozelKarakterler = ["<", ">", "!", "'", "’"];
  ozelKarakterler.forEach(function (karakter) {
    metin = metin.split(karakter).join("");
  });

  // Türkçe harfleri büyük harfe dönüştür
  metin = metin
    .replace(/ı/g, "I") // 'ı' -> 'I'
    .replace(/i/g, "İ") // 'i' -> 'İ'
    .replace(/ğ/g, "Ğ")
    .replace(/ü/g, "Ü")
    .replace(/ş/g, "Ş")
    .replace(/ö/g, "Ö")
    .replace(/ç/g, "Ç");

  // Tüm metni büyük harfe çevir
  return metin.toUpperCase();
}


function deleteRecordFromSheet(deleteData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form"); // Uygun sayfa adını değiştirin
  const data = sheet.getDataRange().getValues(); // Tüm verileri alır
  console.log(deleteData)
  console.log(deleteData.no + "-" + data[1][1].toString());
  console.log(deleteData.text + "-" + data[1][4]);
  console.log(deleteData.sifre + "-" + data[1][5]);
  
  // Verilerde gezinerek belirtilen metni arar
  for (let i = 0; i < data.length; i++) {
    const date = Utilities.formatDate(new Date(data[i][0]), Session.getScriptTimeZone(), "dd/MM/yyyy");
    console.log(date + "-" + deleteData.tarih)
    if (data[i][1].toString() == deleteData.no && data[i][4] == deleteData.text && data[i][5] == deleteData.sifre && date == deleteData.tarih) {
      sheet.deleteRow(i + 1); // Satırı sil (i 0 tabanlı olduğu için 1 eklenir)
      return true; // İşlem başarılı
    }
  }
  return false; // Eğer metin bulunamazsa
}

function compareDates(dateTimeString, dateOnlyString) {
  // 06.12.2024 20:30:58 formatındaki tarihi işle
  const dateTimeParts = dateTimeString.split(" ")[0].split(".");
  const formattedDateTime = `${dateTimeParts[2]}-${dateTimeParts[1]}-${dateTimeParts[0]}`;

  // 06/12/2024 formatındaki tarihi işle
  const dateOnlyParts = dateOnlyString.split("/");
  const formattedDateOnly = `${dateOnlyParts[2]}-${dateOnlyParts[1]}-${dateOnlyParts[0]}`;

  // Karşılaştır
  return formattedDateTime === formattedDateOnly;
}

function sifreKontrol(studentNo,sifre){
  var donen=false;
  var optionSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Option")
  const sifreler = optionSheet.getRange(2,1,optionSheet.getLastRow()-1,4).getValues();
  for (var i =0;i<sifreler.length;i++){
    if(sifreler[i][0]==studentNo && sifreler[i][1]==sifre){
      donen =true
      return donen
    }
  }
  return donen
}
function superSifre(sifre){
  var donen=false;
  var optionSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Option")
  const sifreler = optionSheet.getRange(2,10,optionSheet.getLastRow()-1,2).getValues();
  if (sifreler[0][0]== sifre){
      donen =true
      return donen
  }
  return donen
}
function isDate(value) {
  return !isNaN(Date.parse(value));
}

function isDateUni(value) {
  const parts = value.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts.map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }
  return false;
}

function getStudentData(student) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Kitaplar"); // Sayfa adını ayarlayın
  const data = sheet.getDataRange().getValues();
  // Öğrenci numarasına göre veri arar
  const studentRecords = [];
  if(sifreKontrol(student.no,student.sifre)){
      for (let i = 1; i < data.length; i++) { // Başlık satırını atlamak için 1'den başlar
        if (data[i][1].toString() === student.no.toString() && data[i][2]==student.sifre) {
          const date = Utilities.formatDate(new Date(data[i][0]), Session.getScriptTimeZone(), "dd/MM/yyyy");
          const kitapAdi = data[i][6];
          const kitapSayfa = data[i][7];
          studentRecords.push([date, kitapAdi,kitapSayfa]);
        }
      }
  }


  console.log(studentRecords);

  // Tarih verilerini yakın tarihten eski tarihe sıralar
  studentRecords.sort((a, b) => {
    const dateA = new Date(a[0].split('/').reverse().join('/'));
    const dateB = new Date(b[0].split('/').reverse().join('/'));
    return dateB - dateA; // Yakın tarih önce gelir
  });

  return studentRecords; // Sıralanmış text ve tarih verilerini birleştirir
}
  // no:1 studentNo,sifre2: sifre,kitapAdi: kitapAdi sayfaSayisi: sayf7aSayisi
function deleteRecordFromSheet(deleteData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Kitaplar"); // Uygun sayfa adını değiştirin
  const data = sheet.getDataRange().getValues(); // Tüm verileri alır

  // Verilerde gezinerek belirtilen metni arar
  for (let i = 0; i < data.length; i++) {
    const date = Utilities.formatDate(new Date(data[i][0]), Session.getScriptTimeZone(), "dd/MM/yyyy");
    if (data[i][1].toString() == deleteData.no && data[i][2] == deleteData.sifre && data[i][6] == deleteData.kitapAdi && data[i][7] == deleteData.sayfaSayisi) {
      sheet.deleteRow(i + 1); // Satırı sil (i 0 tabanlı olduğu için 1 eklenir)
      return true; // İşlem başarılı
    }
  }
  return false; // Eğer metin bulunamazsa
}

function sendMessageToTelegram(message) {
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  const payload = {
    chat_id: CHAT_ID,
    text: message,
    parse_mode: 'Markdown'
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true  // Hata yanıtlarını tam olarak görmek için eklendi
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

  } catch (e) {
    Logger.log("Telegram API isteğinde hata oluştu: " + e.message);
  }
}