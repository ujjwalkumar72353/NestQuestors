// eslint-disable-next-line no-unused-vars
import React from 'react'
import {FaSearch} from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';


const Header = () => {
  const {currentUser}=useSelector(state=>state.user);
  return (
    <header className='dark:bg-gray-800 dark:bg-opacity-100 text-white shadow-md'>
        <div className='flex justify-between items-center max-w-6xl mx-auto p-4'>
        <Link to='/'>
        <h1 className='font-bold text-sm sm:text-lg flex flex-wrap'>
         <span className='text-slate-400 text-lg sm:text-2xl'>Nest</span>
         <span className='text-slate-500 text-lg sm:text-2xl'>Questors</span>
        </h1>
        </Link>
        <form className='bg-slate-200 p-3 rounded-lg flex items-center '>
        <input type='text' placeholder='Search...' className='bg-transparent focus:outline-none w-24 sm:w-64 text-slate-800' />
        <FaSearch className='text-slate-800' />
        </form>
        <ul className='flex gap-4'>
          <Link to='/'>
          <li className='hidden text-lg sm:inline text-slate-400 hover:underline'>Home</li>
          </Link>
          <Link to='/about'>
          <li className='hidden text-lg sm:inline text-slate-400 hover:underline'>About</li>
          </Link>
          <Link to='/profile'>
          {
            currentUser ?(<img className='rounded-full h-7 w-7 object-cover' src={currentUser.avatar} alt='profile'/>
            ):( 
              <li className=' sm:inline text-lg text-slate-400 hover:underline mr-3'>Login</li>
            )
          }
          </Link>
        </ul>
        </div>
    </header>
  )
}

export default Header
