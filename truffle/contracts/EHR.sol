pragma solidity >=0.4.22 <0.9.0;

contract EHR { 
  struct Record { 
    string cid;
    string fileName; 
    address patientId;
    address doctorId;
    uint256 timeAdded;
    string dname;
  }

  struct Patient {
    address id;
    string name;
    string adharNumber;
    Record[] records;
  }

  struct Doctor {
    address id;
    string name;
  }

  mapping (string => address) public adharWithAddress;
  mapping (address => Patient) public patients;
  mapping (address => Doctor) public doctors;

  event PatientAdded(address patientId, string name, string adharNumber);
  event DoctorAdded(address doctorId);
  event RecordAdded(string cid, address patientId, address doctorId); 

  // modifiers

  modifier senderExists {
    require(doctors[msg.sender].id == msg.sender || patients[msg.sender].id == msg.sender, "Sender does not exist");
    _;
  }

  modifier patientExists(address patientId) {
    require(patients[patientId].id == patientId, "Patient does not exist");
    _;
  }

  modifier senderIsDoctor {
    require(doctors[msg.sender].id == msg.sender, "Sender is not a doctor");
    _;
  }

  // functions

  function addPatient(address _patientId, string memory _name, string memory _adharNumber) public {
    require(patients[_patientId].id != _patientId, "This patient already exists.");
    // require(adharWithAddress[_adharNumber] != _patientId, "Aadhar Number already exists");
    
    patients[_patientId].id = _patientId;
    patients[_patientId].name = _name;
    patients[_patientId].adharNumber = _adharNumber;
    adharWithAddress[_adharNumber] = _patientId;

    emit PatientAdded(_patientId, _name, _adharNumber);
  }

  function addDoctor(string memory _name) public {
    require(doctors[msg.sender].id != msg.sender, "This doctor already exists.");
    
    doctors[msg.sender].id = msg.sender;
    doctors[msg.sender].name = _name;

    emit DoctorAdded(msg.sender);
  }

  function addRecord(string memory _cid, string memory _fileName, address _patientId) public senderIsDoctor patientExists(_patientId) {
    Record memory record = Record(_cid, _fileName, _patientId, msg.sender, block.timestamp, doctors[msg.sender].name);
    patients[_patientId].records.push(record);

    emit RecordAdded(_cid, _patientId, msg.sender);
  } 

  function getRecords(address _patientId) public view senderExists patientExists(_patientId) returns (Record[] memory) {
    return patients[_patientId].records;
  } 

  function getRecordsByDoctor(address _patientId) public view senderIsDoctor patientExists(_patientId) returns (Record[] memory) {
    uint256 patientRecordsLength = patients[_patientId].records.length;
    Record[] memory recordsByDr = new Record[](patientRecordsLength);
    uint count = 0;

    for(uint256 i = 0; i < patientRecordsLength; i++) {
      if(patients[_patientId].records[i].doctorId == msg.sender){
        recordsByDr[count++] = patients[_patientId].records[i];
      }
    }

    Record[] memory result = new Record[](count);
    for(uint256 i = 0; i < count; i++)
      result[i] = recordsByDr[i]; 

    return result;
  }

  function getSenderRole() public view returns (string memory) {
    if (doctors[msg.sender].id == msg.sender) {
      return "doctor";
    } else if (patients[msg.sender].id == msg.sender) {
      return "patient";
    } else {
      return "unknown";
    }
  }

  function getNames() public view returns (string memory) {
    if (doctors[msg.sender].id == msg.sender) {
      return doctors[msg.sender].name;
    } else if (patients[msg.sender].id == msg.sender) {
      return patients[msg.sender].name;
    } else {
      return "unknown";
    }
  }

  function getPatientExists(address _patientId) public view senderIsDoctor returns (bool) {
    return patients[_patientId].id == _patientId;
  }

  function getAddressWithAadhar(string memory adharNumber) public view senderIsDoctor returns (address) {
    return adharWithAddress[adharNumber];
  }
} 