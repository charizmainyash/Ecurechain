import { Box, Typography, Backdrop, CircularProgress, Divider, TextField } from '@mui/material'
import React from 'react'
import VideoCover from 'react-video-cover'
import BackgroundVideo from '../assets/BackgroundVideo.mp4'
import logo from '../assets/tealNoBG-cropped.png'
import useEth from '../contexts/EthContext/useEth'
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded'
import CustomButton from '../components/CustomButton'
import { useNavigate } from 'react-router-dom'
import LoginRoundedIcon from '@mui/icons-material/LoginRounded'
import { useState } from 'react'
import '../App.css'

const Home = () => {
  const {
    state: { contract, accounts, role, loading },
    dispatch,
  } = useEth()
  const navigate = useNavigate()
  const [name, setName] = useState('');

  const registerDoctor = async () => {
    try {
      await contract.methods.addDoctor(name).send({ from: accounts[0] })
      dispatch({
        type: 'ADD_DOCTOR',
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleChange = (event) => {
    setName(event.target.value);
  }

  const ActionSection = () => {
    if (!accounts) {
      return (
        <Typography variant='h5' color='white'>
          Open your MetaMask wallet to get connected, then refresh this page
        </Typography>
      )
    } else {
      if (role === 'unknown') {
        return (
          <Box display='flex' flexDirection='column' alignItems='center'>
            <Box mb={2}>
              <CustomButton text='Doctor Register' handleClick={() => registerDoctor()}>
                <PersonAddAlt1RoundedIcon style={{ color: 'white' }} />
              </CustomButton>
            </Box>
            <Typography variant='h5' color='white'>
              If you are a patient, ask your doctor to register for you
            </Typography>
          </Box>
        )
      } else if (role === 'patient') {
        return (
          <CustomButton text='Patient Portal' handleClick={() => navigate('/patient')}>
            <LoginRoundedIcon style={{ color: 'white' }} />
          </CustomButton>
        )
      } else if (role === 'doctor') {
        return (
          <CustomButton text='Doctor Portal' handleClick={() => navigate('/doctor')}>
            <LoginRoundedIcon style={{ color: 'white' }} />
          </CustomButton>
        )
      }
    }
  }

  if (loading) {
    return (
      <Backdrop sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color='inherit' />
      </Backdrop>
    )
  } else {
    return (
      <Box
        display='flex'
        flexDirection='column'
        justifyContent='center'
        alignItems='center'
        width='100vw'
        height='100vh'
        id='background'
      >
        <Box
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            top: 0,
            left: 0,
            zIndex: -1,
          }}
        >
          <VideoCover
            videoOptions={{
              src: BackgroundVideo,
              autoPlay: true,
              loop: true,
              muted: true,
            }}
          />
        </Box>
        <Box id='home-page-box' display='flex' flexDirection='column' justifyContent='center' alignItems='center' p={5}>
          <img src={logo} alt='med-chain-logo' style={{ height: 50 }} />
          <Box mt={2} mb={5}>
            <Typography variant='h4' color='white'>
              Own Your Health
            </Typography>
            {role == 'unknown' && <TextField
              id="doctor-name"
              label="Enter your Name"
              value={name}
              onChange={handleChange}
              style={{ backgroundColor: 'white' }}
            />}
          </Box>
          <ActionSection name={name} />
        </Box>
      </Box>
    )
  }
}

export default Home
