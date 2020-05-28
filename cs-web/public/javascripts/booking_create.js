Vue.component('booking-form', {
  template: '#booking-form',
  data: function() {
    return {
      submitResult: null,
      loading: false,
      booking: {
        title: '',
        customerEmail: ''
      }
    };
  },
  async mounted() {},
  methods: {
    submit: async function() {
      this.loading = true;
      const resp = await fetch('/api/bookings', {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify(this.booking)
      });
      this.loading = false;
      if (resp.ok) {
        const result = (await resp.json()).res;

        this.submitResult = {
          success: true,
          msg: 'LINK: ' + result.editUrl + ' | ' + 'PIN: ' + result.pin
        };
      } else {
        this.submitResult = {
          success: false,
          msg: 'Ups... das hätte nie passieeren sollen.'
        };
      }
    }
  }
});

new Vue({ el: '#app' });
