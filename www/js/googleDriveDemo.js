//For ignoring jshint warnings
/*jslint browser:true */
/*global Camera: false, intel: false, $: false, cordova: false, FileTransfer: false, activate_subpage:false, createSealedData: false, getDataFromSealedData: false, secureTransportCall: false, readFromSecureStorage: false, storeInSecureStorage: false */

//#################				Please set these 2 variables (clientID and clientSecret) with values you have generated in Google Developers Console		#################
var clientID = '974719283469-p8j6gd6b2rtv5cqb9a66hq66oksvm9d3.apps.googleusercontent.com';
var clientSecret = 'wzMn7Ck3RPPE1kAoLO3u_O5l';

//Google drive specific values
var redirectURL = 'urn:ietf:wg:oauth:2.0:oob';
var boundary = '-------314159265358979323846';
var delimiter = "\r\n--" + boundary + "\r\n";
var close_delim = "\r\n--" + boundary + "--";
var scope = 'https://www.googleapis.com/auth/drive';
var googleAuthURL = 'https://accounts.google.com/o/oauth2/auth';

//Applications specific values
var imageFullName = '';
var tempFileNameInCache = null;
var token = null;
var refreshToken = null;
var cacheDirectoryPath = '';
var imageDataPrefix = 'data:image/jpg;base64,';
var login_url = null;
var loginWindow = null;
var driveWindow = null;

//We use a custom popup as alert since Windows does not support 'alert' in javascript
function createAlert(message) {
    document.getElementById("alert_message").innerHTML = message;
    $('#alert_popup').popup("open");
}

function closeAlert() {
    $('#alert_popup').popup("close");
}

//Generic failure function
function onFail(errorObj) {
    //add your failure logic here
    createAlert('code = ' + errorObj.code + ', message = ' + errorObj.message);
}

//Generic failure function for SecureTransport which uses the generic onFail and also destroy the SecureTransport object
function onFailSecureTransport(errorObj, instanceID) {
    onFail(errorObj);
    if (instanceID !== 0) {
        intel.security.secureTransport.destroy(null, null, instanceID);
    }
}

//This function gets a code from Google's server based on a client id and a secret. 
//Then using this code another call is performed to Google for getting the token which is used later by upload/download to the drive.
function getOneTimeCodeFromGoogle() {
    if (clientID === 'dummy_client_id_value' || clientSecret === 'dummy_secret_value') {
        createAlert("You are using a dummy values of clientID and clientSecret. Please generate this pair on Google developers console and set in this javascript file.");
        return;
    }
    login_url = googleAuthURL + '?client_id=' + clientID + "&redirect_uri=" + redirectURL + "&response_type=code&scope=" + scope;
    // open Cordova inapp-browser with login url
    loginWindow = window.open(login_url, '_blank', 'location=yes');
    loginWindow.addEventListener('loadstop', function(e) {
        var url = e.url;
        loginWindow.executeScript({
                code: "if(document.getElementById('code')){document.getElementById('code').value;}"
            },
            function(values) {
                var code = values[0];
                if (code) {
                    getTokensByCode(code);
                }
            });
    });
}

//Camera Success callback, simply creates a secure photo using SecureData and then uploads the encrypted photo to Google drive
function takePhotoSuccessCB(imageFromCamera) {
    //uses globalization plugin for creating file name from the system date and time
    navigator.globalization.dateToString(
        new Date(),
        function(date) {
            imageFullName = date.value.split(/\s|\/|:/).join('_') + '.jpg';
            var pic1 = document.getElementById('photo');
            pic1.src = imageDataPrefix + imageFromCamera;
            //takes the base64 image data and creates a secure data (encrypted photo) and uploads to Google Drive
            createSealedData(imageFromCamera, storeToGoogleDriveUsingSecureTransport, onFail);
            activate_subpage("#uib_page_3");
        },
        function() {}, {
            formatLength: 'short',
            selector: 'date and time'
        }
    );
}

//Success callback for 'readSealedPhotoFile'. It shows the photo after decryption
function readSealedPhotoFileSuccessCB(imageDataFromDrive) {
    if (driveWindow !== null) {
        driveWindow.close();
        driveWindow = null;
        $('#photo').attr('src', imageDataPrefix + imageDataFromDrive);
    }
}

//This functions gets the secure photo data which was downloaded from Google Drive, decrypt it using SecureData and gets the photo data and shows to the user
function readSealedPhotoFile(fileEntry) {
    var reader = new FileReader();
    reader.onload = function(e) {
        var imageSealedDataBase64 = reader.result.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
        //remove the old file if exists from cache dir 
        fileEntry.remove(function() {}, function() {});
        getDataFromSealedData(imageSealedDataBase64, readSealedPhotoFileSuccessCB, function() {});
    };
    window.resolveLocalFileSystemURL(fileEntry.toURL(), function(fileEntry2) {
        fileEntry2.file(function(file) {
            reader.readAsDataURL(file);
        });
    }, null);
}


//Downloading a sealed photo in a different window using in-app browser plugin. The file is stored temporary in the cache folder
function downloadSealedPhoto() {
    driveWindow = window.open('https://drive.google.com/drive/my-drive', '_blank', 'location=yes');
    driveWindow.addEventListener('loadstart', function(e) {
        var url = e.url;
        if (url.search('e=download') !== -1) {
            var fileTransfer = new FileTransfer();
            fileTransfer.download(
                url,
                tempFileNameInCache,
                function(fileEntry) {
                    //the file was stored in cache folder successfully and now it should be decrypted using secure data
                    readSealedPhotoFile(fileEntry);
                },
                null
            );
        }
    });
}

//Camera onClick event, the success callback 'takePhotoSuccess' will be called when the photo is ready
function takePhoto() {
    navigator.camera.getPicture(takePhotoSuccessCB, null, {
        quality: 40,
        destinationType: Camera.DestinationType.DATA_URL,
        allowEdit: true,
        saveToPhotoAlbum: false,
        correctOrientation: true
    });
}
//Success callback for 'getTokenByRefreshToken'. Setting the global variable 'token' from the server
function getTokenByRefreshTokenSuccessCB(instanceID, response) {
    token = JSON.parse(response.responseBody).access_token;
    intel.security.secureTransport.destroy(null, null, instanceID);
}
//Failure callback for 'getTokenByRefreshToken'
function getTokenByRefreshTokenFailureCB() {
    $('#drive_success').hide();
    createAlert('Network issue');
}

//Getting the new token from Google Drive with the stored refresh token using SecureTransport https request
function getTokenByRefreashToken(successCB, failureCB) {
    var url = 'https://www.googleapis.com/oauth2/v3/token';
    var requestData = 'client_id=' + clientID + '&client_secret=' + clientSecret + '&' + 'refresh_token=' + refreshToken + '&grant_type=refresh_token';
    var headersToRequest = {
        'Content-Type': 'application/x-www-form-urlencoded'
    };
    var options = {
        'url': url,
        'requestBody': requestData,
        'headers': headersToRequest,
        'httpMethod': 'POST'
    };
    secureTransportCall(options, getTokenByRefreshTokenSuccessCB, getTokenByRefreshTokenFailureCB);
}

//Success callback for 'readRefreshToken'. Setting the global variable 'refreshToken' and calls 'getTokenByRefreashToken' for getting the token from server
function readRefreshTokenSuccessCB(refreshTokenData) {
    //refresh token successfully read, now get the actual token
    refreshToken = refreshTokenData;
    getTokenByRefreashToken();
}

//Reading the Google refresh token securely using SecureStorage
function readRefreshToken() {
    var options = {
        'id': 'refreshToken'
    };
    readFromSecureStorage(options, readRefreshTokenSuccessCB, getOneTimeCodeFromGoogle);
}

//Success callback for 'getTokensByCode'. It gets the new refresh token and token from server and stores the refresh token in SecureStorage
function getTokenByCodeSuccessCB(instanceID, response) {
    loginWindow.close();
    loginWindow = null;
    refreshToken = JSON.parse(response.responseBody).refresh_token;
    token = JSON.parse(response.responseBody).access_token;
    intel.security.secureTransport.destroy(null, null, instanceID);
    //storing the refresh token using SecureStorage for later use
    var options = {
        'data': refreshToken,
        'id': 'refreshToken'
    };
    storeInSecureStorage(options, null, onFail);
}

//This function uses Secure Transport API to make a call to Google Drive to get the Google session token from the code which was recieved earlier
function getTokensByCode(code) {
    var requestData = 'code=' + code + '&client_id=' + clientID + '&client_secret=' + clientSecret + '&redirect_uri=' + redirectURL + '&grant_type=authorization_code';
    var url = 'https://www.googleapis.com/oauth2/v3/token';
    var headersToRequest = {
        'Content-Type': 'application/x-www-form-urlencoded'
    };
    var options = {
        'url': url,
        'requestBody': requestData,
        'headers': headersToRequest,
        'httpMethod': 'POST'
    };
    secureTransportCall(options, getTokenByCodeSuccessCB, onFailSecureTransport);
}

//Success callback of 'storeToGoogleDriveUsingSecureTransport'. It shows the success upload pop-up. 
//If the connection succeeded but the http code was 401, it simply calling 'getOneTimeCodeFromGoogle' for authenticating Google server
function storeToGoogleDriveUsingSecureTransportSuccessCB(instanceID, response) {
    intel.security.secureTransport.destroy(null, null, instanceID);
    var error = JSON.parse(response.responseBody).error;
    if (error !== undefined) {
        if (error.code === 401 /*Unauthorized*/ ) {
            getOneTimeCodeFromGoogle();
            return;
        }
    }
    //pop-up that the sealed photo was stored successfully
    $('#photo_ready').popup("open");
}

//Uploading the secure (sealed) photo in Google Drive securely using SecureTransport
function storeToGoogleDriveUsingSecureTransport(photoSealedData) {
    //prepare the Google Drive expected request body based on https://developers.google.com/drive/v2/reference/files/update
    var url = 'https://www.googleapis.com/upload/drive/v2/files?uploadType=multipart';
    var metadata = {
        'title': imageFullName,
        'mimeType': 'application/octet-stream'
    };
    var multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + 'image/jpg' + '\r\n' +
        'Content-Transfer-Encoding: base64\r\n' + '\r\n' +
        photoSealedData + close_delim;

    //adding expected headers for Google Drive 
    var headersToRequest = {
        'Content-Type': 'multipart/mixed; boundary="' + boundary + '"',
        'Authorization': 'Bearer ' + token
    };
    //sending the sealed photo using SecureTransport API
    var options = {
        'url': url,
        'requestBody': multipartRequestBody,
        'headers': headersToRequest,
        'httpMethod': 'POST'
    };
    secureTransportCall(options, storeToGoogleDriveUsingSecureTransportSuccessCB, onFailSecureTransport);
}

//Reads refresh token if available, if not sign-in flow is initiated.
var onDeviceReady = function() {
    //setting the cache folder dir
    cacheDirectoryPath = cordova.file.cacheDirectory;
    //setting the filename which will be used for the download content via file transfer plugin
    tempFileNameInCache = cacheDirectoryPath + 'sealed_photo.jpg';
    readRefreshToken();
};

document.addEventListener("deviceready", onDeviceReady, false);