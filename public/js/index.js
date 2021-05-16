import '@babel/polyfill';
import { showAlert } from './alert';
import { login, logout } from './login';
import { displayMap } from './mapbox';
import { bookTour } from './stripe';
import {updateUserData} from './updateSettings'




//DOM ELEMENTS
const mapbox = document.getElementById('map')
const loginForm = document.querySelector('.form')
const logoutBtn = document.querySelector('.nav__el--logout')
const updateUser = document.querySelector('.form-user-data')
const updatePassword = document.querySelector('.form-user-password')
const bookBtn = document.getElementById('book-tour')
const alertMessage = document.querySelector('body').dataset.alert



//DELEGATION
if(mapbox){
    const locations = JSON.parse(mapbox.dataset.locations);
    displayMap(locations);
}

if(loginForm){
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email, password);
      });
}


if(logoutBtn) logoutBtn.addEventListener('click',logout)

if(updateUser) {
    updateUser.addEventListener('submit',e=>{
        e.preventDefault();
        // console.log('clicked')

        const form = new FormData();
        form.append('name', document.getElementById('name').value);
        form.append('email', document.getElementById('email').value);
        form.append('photo', document.getElementById('photo').files[0]);
        // console.log(form);


        // const name = document.getElementById('name').value
        // const email = document.getElementById('email').value

        updateUserData(form, 'data')
    })
}


if(updatePassword) {
    updatePassword.addEventListener('submit', async e=>{
        e.preventDefault();
        document.querySelector('.btn--save-password').textContent = 'Updating...'
        const passwordCurrent = document.getElementById('password-current').value
        const password = document.getElementById('password').value
        const passwordConfirm = document.getElementById('password-confirm').value


        await updateUserData({passwordCurrent,password,passwordConfirm}, 'password')

        document.getElementById('password-current').value=''
        document.getElementById('password').value=''
        document.getElementById('password-confirm').value=''

        document.querySelector('.btn--save-password').textContent = 'Save Password'


    })
}

if(bookBtn){
    bookBtn.addEventListener('click',e=>{
        console.log('clicked')
        e.target.textContent = 'Processing...'
        const {tourId} = e.target.dataset
        bookTour(tourId)
    })
}

if(alertMessage) showAlert('Success', alertMessage)