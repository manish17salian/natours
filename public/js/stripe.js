import axios from "axios"
import { showAlert } from "./alert";
const stripe = Stripe('pk_test_51IrHPNSE8AnQKrMmIPumOrS9H7eCKMa45zh60bbSVOraWMqDo5pIrXgotUh6qruxh6KqYBPpTSJdrfHNziMB4h1300UtFBWOOB');


export const bookTour = async (tourId)=>{
try {
         // 1) Get checkout session from API
         const session = await axios(
            `http://127.0.0.1:3000/api/v1/booking/checkout-session/${tourId}`
          );
    console.log(session)


    await stripe.redirectToCheckout({
        sessionId: session.data.session.id
      });   
} catch (err) {
    console.log(err)
    showAlert(err)
}
}