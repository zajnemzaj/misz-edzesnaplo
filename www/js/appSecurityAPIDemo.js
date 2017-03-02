//For ignoring jshint warnings
/*global intel: false */

//making a secure https send request using SecureTransport
function secureTransportCall(options, successCB, failureCB) {
    var instanceIDVar = 0;
    intel.security.secureTransport.open(function(instanceID) {
            instanceIDVar = instanceID;
            intel.security.secureTransport.setHeaders(function() {
                    intel.security.secureTransport.sendRequest(function(response) {
                            successCB(instanceIDVar, response);
                        },
                        function(errorObj) {
                            failureCB(errorObj, instanceIDVar);
                        }, {
                            'instanceID': instanceIDVar,
                            'requestBody': options.requestBody
                        });
                },
                function(errorObj) {
                    failureCB(errorObj, instanceIDVar);
                }, {
                    'instanceID': instanceIDVar,
                    'headers': options.headers
                });
        },
        function(errorObj) {
            failureCB(errorObj, instanceIDVar);
        }, {
            'url': options.url,
            'method': options.httpMethod
        });
}

//Reading data from the secure storage
function readFromSecureStorage(options, successCB, failureCB) {
    intel.security.secureStorage.read(function(SD_instranceID) {
            intel.security.secureData.getData(function(data) {
                    successCB(data);
                    intel.security.secureData.destroy(null, null, SD_instranceID);
                },
                function(errorObj) {
                    failureCB(errorObj);
                }, SD_instranceID);
        },
        function(errorObj) {
            failureCB(errorObj);
        }, {
            'id': options.id
        });
}

//Storing data securely on SecureStorage for later use
function storeInSecureStorage(options, successCB, failureCB) {
    intel.security.secureData.createFromData(function(instanceID) {
            intel.security.secureStorage.write(function() {
                    intel.security.secureData.destroy(successCB, failureCB, instanceID);
                },
                function(errorObj) {
                    failureCB(errorObj);
                }, {
                    'id': options.id,
                    'instanceID': instanceID
                });
        },
        function(errorObj) {
            failureCB(errorObj);
        }, {
            'data': options.data
        });
}

//Creating sealed data from plaintext data using SecureData
function createSealedData(data, successCB, failureCB) {
    intel.security.secureData.createFromData(function(instanceID) {
            intel.security.secureData.getSealedData(function(sealedDataAfterEncryption) {
                    //The sealed data of the photo is now sending securely to Google Drive
                    successCB(sealedDataAfterEncryption);
                    intel.security.secureData.destroy(null, failureCB, instanceID);
                },
                function(errorObj) {
                    failureCB(errorObj);
                }, instanceID);
        },
        function(errorObj) {
            failureCB(errorObj);
        }, {
            'data': data
        });
}

//Getting the plaintext data from a sealed data using SecureData
function getDataFromSealedData(sealedDataToDecrypt, successCB, failureCB) {
    intel.security.secureData.createFromSealedData(function(instanceID) {
            intel.security.secureData.getData(function(data) {
                    successCB(data);
                    intel.security.secureData.destroy(null, null, instanceID);
                },
                function(errorObj) {
                    failureCB(errorObj);
                }, instanceID);
        },
        function(errorObj) {
            failureCB(errorObj);
        }, {
            'sealedData': sealedDataToDecrypt
        });
}