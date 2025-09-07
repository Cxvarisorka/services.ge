document.getElementById('resetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

  
    try {
      const res = await fetch(`/api/v1/users/resetPassword/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, passwordConfirm })
      });
  
      const data = await res.json();

      console.log(data)
      const messageEl = document.getElementById('message');
  
      if (res.ok) {
        messageEl.style.color = 'green';
        messageEl.textContent = 'Password reset successful! You can now log in.';
      } else {
        messageEl.style.color = 'red';
        messageEl.textContent = data.message || 'Something went wrong.';
      }
    } catch (err) {
      document.getElementById('message').textContent = 'Server error. Try again later.';
    }
});
  