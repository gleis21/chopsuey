const checkoutButton = document.getElementById('checkout-button');
const printButton = document.getElementById('print-button');

if (printButton) {
  printButton.addEventListener('click', function () { window.print(); }, false);
}
if (checkoutButton) {
  checkoutButton.addEventListener('click', function () { doCheckout(); }, false);
}

async function doCheckout() {
  document.getElementById('error-agb-gdpr').style.display = 'none';
  document.getElementById('error-generic').style.display = 'none';
  document.getElementById('success-msg').style.display = 'none';

  const acceptAgb = document.getElementById('accept-agb');
  const acceptGdpr = document.getElementById('accept-gdpr');

  if (!acceptAgb.checked || !acceptGdpr.checked) {
    document.getElementById('error-agb-gdpr').style.display = 'block';
    return;
  }
  checkoutButton.disabled = true;

  const bookingId = document.getElementById('bookingId').value;
  const res = await fetch('/buchungssystem/api/bookings/' + bookingId + '/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}'
  });

  if (res.ok) {
    document.getElementById('error-agb-gdpr').style.display = 'none';
    document.getElementById('error-generic').style.display = 'none';
    document.getElementById('success-msg').style.display = 'block';
    checkoutButton.style.display = 'none';
    printButton.style.display = 'block';
    acceptAgb.disabled = true;
    acceptGdpr.disabled = true;
    window.print();
  } else {
    checkoutButton.disabled = false;
    document.getElementById('error-generic').style.display = 'block';
  }
}
