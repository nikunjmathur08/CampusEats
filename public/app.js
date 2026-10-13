document.addEventListener('DOMContentLoaded', function () {
  var couponForm = document.getElementById('coupon-form');
  if (!couponForm) return;

  couponForm.addEventListener('submit', function (event) {
    event.preventDefault();
    var input = couponForm.querySelector('[name="coupon"]');
    var line = document.getElementById('discount-line');

    fetch('/cart/coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'coupon=' + encodeURIComponent(input.value),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.error) {
          line.hidden = false;
          line.textContent = data.error;
          return;
        }
        line.hidden = false;
        line.textContent = 'Coupon result: ' + data.discounted;
      })
      .catch(function () {
        line.hidden = false;
        line.textContent = 'Coupon could not be applied.';
      });
  });
});
