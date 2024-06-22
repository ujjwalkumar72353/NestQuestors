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


const App = () => {
  return <BrowserRouter>
   <Header/>
  <Routes>
  <Route path='/' element={<Home/>}/>
  <Route path='/sign-in' element={<Signin/>}/>
  <Route path='/sign-up' element={<SignUp/>}/>
  <Route path='/about' element={<About/>}/>
  <Route element={<PrivateRoute/>}>
  <Route path='/profile' element={<Profile/>}/>
  </Route>
  </Routes>
  <Footer/>
  </BrowserRouter>
}

export default App
