///////////////////////////////////////////////////////////////////////////
// login

const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

const showAlert = (type, msg) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, 5000);
};

const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      // window.setTimeout(() => {
      location.assign('/');
      // }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

///////////////////////////////////////////////////////////
// sign up

const signUp = async (name, email, password, passwordConfirm) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        passwordConfirm,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Signed up successfully!');
      window.setTimeout(() => {
        location.assign('/confirm-account');
      }, 1000);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

///////////////////////////////////////////////////////////
// forgot passowrd
const forgotPassword = async (email) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/forgotPassword',
      data: {
        email,
      },
    });
    if (res.data.status === 'success') {
      // showAlert('success', 'signed up successfully!');
      window.setTimeout(() => {
        location.assign('/sent-reset-link');
      }, 1000);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

///////////////////////////////////////////////////////////////
// reset password

const resetPassword = async (password, passwordConfirm, resetToken) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `http://127.0.0.1:3000/api/v1/users/resetPassword/${resetToken}`,
      data: {
        password,
        passwordConfirm,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Successfully resetted password');

      // Redirect to the login page after a delay
      window.setTimeout(() => {
        location.assign('/login');
      }, 1000);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

//////////////////////////////////////////////////////////////////////////////
// logout

const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout',
    });
    if (res.data.status === 'success') {
      window.location.href = '/';
    }
  } catch (err) {
    showAlert('error', 'error trying to log out! try again');
  }
};

/////////////////////////////////////////////////////////////////
// update current user data

const updateData = async (name, email, photo) => {
  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('photo', photo);

    const res = await axios.patch(
      'http://127.0.0.1:3000/api/v1/users/update',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );

    if (res.data.status === 'success') {
      showAlert('success', 'Data successfully updated');
      // Additional actions upon successful update
    }
  } catch (err) {
    showAlert(
      'error',
      err.response.data.message || 'An error occurred while updating data',
    );
  }
};

////////////////////////////////////////////////////
// update password

const updatePasswordForm = async (
  passwordCurrent,
  password,
  passwordConfirm,
) => {
  try {
    //   if (password !== passwordConfirm) {
    //     showAlert('error', 'New password and confirmation do not match');
    //     return;
    //   }

    const res = await axios({
      method: 'PATCH',
      url: 'http://127.0.0.1:3000/api/v1/users/updateMyPassword',
      data: {
        passwordCurrent,
        password,
        passwordConfirm,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Password successfully updated');
    }
  } catch (err) {
    showAlert(
      'error',
      err.response.data.message ||
        'An error occurred while trying to update the password',
    );
  }
};

/////////////////////////////////////////////////////
// stripe booking

const stripe = Stripe(
  'pk_test_51OQdgmHzv4gQIPfhigbGgMV8w0zTEwj9bCvnB6rDSU8hNvwB2q9PoP2w75rKAjaDc1MbirLecFzpojU7ShA4qJdp00nbOLGGey',
);

const bookTour = async (tourId) => {
  try {
    // 1 get checkout session from api
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/booking/checkout-session/${tourId}`,
    );

    console.log(session);

    // 2 create checkut session and charge credit card

    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err.message);
    showAlert('error', err);
  }
};

const updateForm = document.querySelector('.form-user-data');
const updatePassword = document.querySelector('.form-user-password');
const loginForm = document.querySelector('.form');
const logoutButton = document.querySelector('.nav__el--logout');
const bookBtn = document.getElementById('book-btn');
const signupForm = document.querySelector('.form-signup');
const forgotPasswordButton = document.querySelector('.form-forgot-password');
const resetPasswordButton = document.querySelector('.form-reset-password');

if (updateForm) {
  updateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save').style.opacity = '0.5';
    document.querySelector('.btn--save').textContent = 'updating...';

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const photo = document.getElementById('photo').files[0];

    await updateData(name, email, photo);
    document.querySelector('.btn--save').textContent = 'save settings';
    document.querySelector('.btn--save').style.opacity = '1';
  });
} else if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--login').style.opacity = '0.5';
    document.querySelector('.btn--login').textContent = 'logging in...';
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    await login(email, password);
    document.querySelector('.btn--login').style.opacity = '1';
    document.querySelector('.btn--login').textContent = 'login';
  });
}

if (logoutButton) {
  logoutButton.addEventListener('click', logout);
}

if (updatePassword) {
  updatePassword.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--status').style.opacity = '0.5';
    document.querySelector('.btn--status').textContent = 'updating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    // Pass an object with password data to the updatePasswordForm function
    await updatePasswordForm(passwordCurrent, password, passwordConfirm);

    document.querySelector('.btn--status').style.opacity = '1';
    document.querySelector('.btn--status').textContent = 'save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

if (bookBtn) {
  bookBtn.addEventListener('click', async (e) => {
    e.target.textContent = 'Processing...';
    const tourId = e.target.dataset.tourId;
    bookTour(tourId);

    setTimeout(() => {
      e.target.textContent = 'book tour now!';
    }, 7000);
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--signup').style.opacity = '0.5';
    document.querySelector('.btn--signup').textContent = 'signing up...';

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await signUp(name, email, password, passwordConfirm);
    document.querySelector('.btn--signup').style.opacity = '1';
    document.querySelector('.btn--signup').textContent = 'sign up';
  });
}

if (forgotPasswordButton) {
  forgotPasswordButton.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--forgot').style.opacity = '0.5';
    document.querySelector('.btn--forgot').textContent =
      'Sending reset link...';

    const email = document.getElementById('email').value;

    await forgotPassword(email);

    document.querySelector('.btn--forgot').style.opacity = '1';
    document.querySelector('.btn--forgot').textContent =
      'Send password resett email';
  });
}

if (resetPasswordButton) {
  resetPasswordButton.addEventListener('submit', async (e) => {
    e.preventDefault();

    document.querySelector('.btn--reset').style.opacity = '0.5';
    document.querySelector('.btn--reset').textContent = 'Resetting password...';

    // Get the resetToken from the URL parameters
    const urlParams = window.location.pathname.split('/').pop();

    // Get the password and passwordConfirm from the form fields
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    // Call the resetPassword function with the obtained resetToken
    await resetPassword(password, passwordConfirm, urlParams);

    document.querySelector('.btn--reset').style.opacity = '1';
    document.querySelector('.btn--reset').textContent = 'Reset password';
  });
}
