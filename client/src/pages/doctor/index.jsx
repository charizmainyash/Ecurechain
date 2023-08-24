import { Box, Divider, FormControl, Modal, TextField, Typography, Backdrop, CircularProgress, Grid, InputLabel } from '@mui/material'
import React, { useCallback, useEffect } from 'react'
import { useState } from 'react'
import CustomButton from '../../components/CustomButton'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import useEth from '../../contexts/EthContext/useEth'
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded'
import useAlert from '../../contexts/AlertContext/useAlert'
import AddRecordModal from './AddRecordModal'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import ipfs from '../../ipfs'
import Record from '../../components/Record'

const Doctor = () => {
  const {
    state: { contract, accounts, role, loading },
  } = useEth()
  const { setAlert } = useAlert()

  const [patientExist, setPatientExist] = useState(false)
  const [searchAadharNumber, setSearchAadharNumber] = useState('')
  const [addPatientAddress, setAddPatientAddress] = useState('')
  const [addPatientName, setAddPatientName] = useState('')
  const [aadharNumber, setAadharNumber] = useState('')
  const [records, setRecords] = useState([])
  const [addRecord, setAddRecord] = useState(false)
  const [searchPatientAddress, setSearchPatientAddress] = useState('')

  useEffect(() => {
    if(searchPatientAddress != '')
      searchPatient()
  },[searchPatientAddress])

  const searchPatientWithAadhar = async () => {
    try {
      if (!isValidAadhar(searchAadharNumber)) {
        setAlert('Please enter a valid Aadhar Number', 'error')
        return
      }

      const x = await contract.methods.getAddressWithAadhar(searchAadharNumber).call({ from: accounts[0] });
      if (!x) {
        setAlert('Patient does not exist with this aadhar number', 'error')
      } else {
        setSearchPatientAddress(x)
      }
      
    } catch (err) {
      console.error(err)
    }
  }

  const searchPatient = async () => {
    try {
      if (!/^(0x)?[0-9a-f]{40}$/i.test(searchPatientAddress)) {
        setAlert('Please enter a valid wallet address', 'error')
        return
      }
      const patientExists = await contract.methods.getPatientExists(searchPatientAddress).call({ from: accounts[0] })
      if (patientExists) {
        const records = await contract.methods.getRecordsByDoctor(searchPatientAddress).call({ from: accounts[0] })
        console.log('records :>> ', records)
        setRecords(records)
        setPatientExist(true)
      } else {
        setAlert('Patient does not exist', 'error')
      }
    } catch (err) {
      console.error(err)
    }
  }

  function isValidAadhar(aadharNumber) {
    const aadharRegex = /^\d{12}$/; // Aadhar number should be 12 digits long
    return aadharRegex.test(aadharNumber);
  }

  const registerPatient = async () => {
    if (isValidAadhar(aadharNumber)) {
      const x = await contract.methods.getAddressWithAadhar(aadharNumber).call({ from: accounts[0] })
      if (x != "0x0000000000000000000000000000000000000000" && x != addPatientAddress) {
        setAadharNumber('')
        setAlert('Aadhar number already exists', 'error')
      } else {
        try {
          await contract.methods.addPatient(addPatientAddress, addPatientName, aadharNumber).send({ from: accounts[0] })
          setAddPatientAddress('')
          setAddPatientName('')
          setAadharNumber('')
          setAlert('New Patient Added', 'success')
        } catch (err) {
          setAddPatientAddress('')
          setAddPatientName('')
          setAadharNumber('')
          setAlert('This Patient Already exists or the aadhar is already in use', 'error')
          console.error(err)
  
        }
      }
      
    } else {
      setAlert('Aadhar number is not valid', 'error')
      setAadharNumber('')
    }
  }

  const addRecordCallback = useCallback(
    async (buffer, fileName, patientAddress) => {
      if (!patientAddress) {
        setAlert('Please search for a patient first', 'error')
        return
      }
      try {
        const res = await ipfs.add(buffer)
        const ipfsHash = res[0].hash
        if (ipfsHash) {
          await contract.methods.addRecord(ipfsHash, fileName, patientAddress).send({ from: accounts[0] })
          setAlert('New record uploaded', 'success')
          setAddRecord(false)

          // refresh records
          const records = await contract.methods.getRecordsByDoctor(patientAddress).call({ from: accounts[0] })
          console.log(records)
          setRecords(records)
        }
      } catch (err) {
        setAlert('Record upload failed', 'error')
        console.error(err)
      }
    },
    [addPatientAddress, accounts, contract]
  )

  if (loading) {
    return (
      <Backdrop sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color='inherit' />
      </Backdrop>
    )
  } else {
    return (
      <Box display='flex' justifyContent='center' width='100vw'>
        <Box width='60%' my={5}>
          {!accounts ? (
            <Box display='flex' justifyContent='center'>
              <Typography variant='h6'>Open your MetaMask wallet to get connected, then refresh this page</Typography>
            </Box>
          ) : (
            <>
              {role === 'unknown' && (
                <Box display='flex' justifyContent='center'>
                  <Typography variant='h5'>You're not registered, please go to home page</Typography>
                </Box>
              )}
              {role === 'patient' && (
                <Box display='flex' justifyContent='center'>
                  <Typography variant='h5'>Only doctor can access this page</Typography>
                </Box>
              )}
              {role === 'doctor' && (
                <>
                  <Modal open={addRecord} onClose={() => setAddRecord(false)}>
                    <AddRecordModal
                      handleClose={() => setAddRecord(false)}
                      handleUpload={addRecordCallback}
                      patientAddress={searchPatientAddress}
                    />
                  </Modal>

                  <Typography variant='h4'>Patient Records</Typography>
                  <Box display='flex' alignItems='center' my={1}>
                    <FormControl fullWidth>
                      <TextField
                        variant='outlined'
                        placeholder='Search patient by aadhar number'
                        value={searchAadharNumber}
                        onChange={e => setSearchAadharNumber(e.target.value)}
                        InputProps={{ style: { fontSize: '15px' } }}
                        InputLabelProps={{ style: { fontSize: '15px' } }}
                        size='small'
                      />
                    </FormControl>
                    <Box mx={2}>
                      <CustomButton text={'Search'} handleClick={() => searchPatientWithAadhar()}>
                        <SearchRoundedIcon style={{ color: 'white' }} />
                      </CustomButton>
                    </Box>
                    <CustomButton text={'New Record'} handleClick={() => setAddRecord(true)} disabled={!patientExist}>
                      <CloudUploadRoundedIcon style={{ color: 'white' }} />
                    </CustomButton>
                  </Box>

                  {patientExist && records.length === 0 && (
                    <Box display='flex' alignItems='center' justifyContent='center' my={5}>
                      <Typography variant='h5'>No records found</Typography>
                    </Box>
                  )}

                  {patientExist && records.length > 0 && (
                    <Box display='flex' flexDirection='column' mt={3} mb={-2}>
                      {records.map((record, index) => (
                        <Box mb={2}>
                          <Record key={index} record={record} />
                        </Box>
                      ))}
                    </Box>
                  )}

                  <Box mt={6} mb={4}>
                    <Divider />
                  </Box>

                  <Typography variant='h4'>Register Patient</Typography>
                  <Box display='flex' alignItems='center' my={1}>
                    <FormControl fullWidth>
                      <TextField
                        variant='outlined'
                        placeholder='Register patient by wallet address'
                        value={addPatientAddress}
                        onChange={e => setAddPatientAddress(e.target.value)}
                        InputProps={{ style: { fontSize: '15px' } }}
                        InputLabelProps={{ style: { fontSize: '15px' } }}
                        style={{ marginBottom: '10px' }}
                        size='small'
                      />
                      <TextField
                        variant='outlined'
                        placeholder='Enter Patient Name'
                        value={addPatientName}
                        onChange={e => setAddPatientName(e.target.value)}
                        InputProps={{ style: { fontSize: '15px' } }}
                        InputLabelProps={{ style: { fontSize: '15px' } }}
                        style={{ marginBottom: '10px' }}
                        size='small'
                      />
                      <TextField
                        variant='outlined'
                        placeholder='Enter Unique Aadhar Number'
                        value={aadharNumber}
                        onChange={e => setAadharNumber(e.target.value)}
                        InputProps={{ style: { fontSize: '15px' } }}
                        InputLabelProps={{ style: { fontSize: '15px' } }}
                        style={{ marginBottom: '10px' }}
                        size='small'
                      />
                    </FormControl>
                    <Box mx={2}>
                      <CustomButton text={'Register'} handleClick={() => registerPatient()}>
                        <PersonAddAlt1RoundedIcon style={{ color: 'white' }} />
                      </CustomButton>
                    </Box>
                  </Box>
                </>
              )}
            </>
          )}
        </Box>
      </Box>

    )
  }
}

export default Doctor
