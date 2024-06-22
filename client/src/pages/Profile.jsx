// eslint-disable-next-line no-unused-vars
import React from 'react'
import { useSelector } from 'react-redux'

const Profile = () => {
  const {currentUser}=useSelector(state=>state.user)
  return (
    <div className='p-3 max-w-lg mx-auto'>
     <h1 className='text-3xl text-center font-semibold my-7'>Profile</h1>
     <form className='flex flex-col gap-4'>
      <img className='rounded-full h-24 w-24 object-cover cursor-pointer self-center mt-2' src={currentUser.avatar} alt='profile'/>
      <input type='text' placeholder='Username' id='username' className='border p-3 rounded-lg  '/>
      <input type='text' placeholder='Email' id='username' className='border p-3 rounded-lg '/>
      <input type='text' placeholder='Password' id='username' className='border p-3 rounded-lg '/>
      <button className='bg-slate-700 p-3 text-white uppercase rounded-lg hover:opacity-95 disabled:opacity-80'>Update</button>
     </form>
     <div className='flex justify-between mt-5'>
     <span className='text-orange-700 cursor-pointer'>
     Delete account
     </span>
     <span  className='text-orange-700 cursor-pointer'>
      Sign out
     </span>
     </div>
    </div>
  )
}

export default Profile
