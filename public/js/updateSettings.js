import axios from 'axios';
import {showAlert} from './alert';



export const updateUserData = async (data,type)=>{
    console.log(data)
    
    try {
        const url = type ==='password' ?'http://127.0.0.1:3000/api/v1/users/updateMyPassword' : 'http://127.0.0.1:3000/api/v1/users/updateMe'
        const res = await axios({
            method:'PATCH',
            url,
            data
        })

    if(res.data.status === 'success'){
        showAlert('success','Updated Successfully')
    }
    
        console.log(res)
    } catch (error) {
        showAlert('error', error.response.data.message)
    }


}
