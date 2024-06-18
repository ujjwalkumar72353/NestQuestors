// eslint-disable-next-line no-unused-vars
import React from 'react'
import { Link } from 'react-router-dom'

const SignUp = () => {
  return (
    <div className='m-3 max-w-lg mx-auto'>
    <h1 className="text-3xl text-center font-semibold my-7" >
       Sign Up
    </h1>
    <form className='flex flex-col gap-4'>
    <input  type='text' placeholder='username'  className='border p-3 rounded-lg'  id='username'/>
    <input  type='text' placeholder='email'  className='border p-3 rounded-lg'  id='email'/>
    <input  type='number' placeholder='password'  className='border p-3 rounded-lg'  id='password'/>
    <button className='p-3 bg-slate-800 text-white rounded-lg uppercase hover:opacity-95 disabled:opacity-80'>Sign Up</button>
    </form>
    <div className='flex gap-3 mt-5'>
      <p>Have an account?</p>
      <Link to={"/sign-in"}>
      <span className='text-blue-500'>Sign in</span>
      </Link>
    </div>
    </div>
  )
}

export default SignUp
