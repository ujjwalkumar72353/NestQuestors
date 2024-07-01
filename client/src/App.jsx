// eslint-disable-next-line no-unused-vars
import React from 'react'
import { BrowserRouter,Routes,Route } from 'react-router-dom';
import Home from './pages/Home';
import Signin from './pages/Signin';

import About from './pages/About';
import Profile from './pages/Profile';
import Header from './Component/Header';
import Footer from './Component/Footer';
import SignUp from './pages/Signup';
import PrivateRoute from './Component/PrivateRoute';
import CreateListing from './pages/CreateListing';
import UpdateListing from './pages/UpdateListing';
import Listing from './pages/Listing';


const App = () => {
  return (
    <div className='flex flex-col min-h-screen'>
  <BrowserRouter>
   <Header/>
   <div className='flex-1'>
  <Routes>
  <Route path='/' element={<Home/>}/>
  <Route path='/sign-in' element={<Signin/>}/>
  <Route path='/sign-up' element={<SignUp/>}/>
  <Route path='/about' element={<About/>}/>
  <Route path='/listing/:listingId' element={<Listing/>}/>
  <Route element={<PrivateRoute />}>
     <Route path='/profile' element={<Profile />} />
     <Route path='/create-listing' element={<CreateListing />} />
     <Route path='update-listing/:listingId' element={<UpdateListing />}/>
   </Route>
  </Routes>
  </div>
  <Footer/>
  </BrowserRouter>
  </div>
  )
}

export default App
