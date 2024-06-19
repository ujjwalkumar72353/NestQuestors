// eslint-disable-next-line no-unused-vars
import React from 'react'
import {FaSearch} from 'react-icons/fa';
import { Link } from 'react-router-dom';


const Header = () => {
  return (
    <header className='bg-slate-300 shadow-md'>
        <div className='flex justify-between items-center max-w-6xl mx-auto p-3'>
        <Link to='/'>
        <h1 className='font-bold text-sm sm:text-lg flex flex-wrap'>
         <span className='text-slate-600 text-lg sm:text-2xl'>Nest</span>
         <span className='text-slate-800 text-lg sm:text-2xl'>Questors</span>
        </h1>
        </Link>
        <form className='bg-slate-100 p-3 rounded-lg flex items-center '>
        <input type='text' placeholder='Search...' className='bg-transparent focus:outline-none w-24 sm:w-64' />
        <FaSearch className='text-slate-600' />
        </form>
        <ul className='flex gap-4'>
          <Link to='/'>
          <li className='hidden text-lg sm:inline text-slate-800 hover:underline'>Home</li>
          </Link>
          <Link to='/about'>
          <li className='hidden text-lg sm:inline text-slate-800 hover:underline'>About</li>
          </Link>
          <Link to='/sign-in'>
          <li className=' sm:inline text-lg text-slate-800 hover:underline mr-3'>Login</li>
          </Link>
        </ul>
        </div>
    </header>
  )
}

export default Header
