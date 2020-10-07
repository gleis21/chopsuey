Vue.component('booking-form', {
  template: '#booking-form',
  data: function() {
    return {
      submitResult: null,
      loading: false,
      agents: [],
      agent: null,
      booking: {
        title: '',
        customerEmail: ''
      }
    };
  },
  async created() {
    const resp = await fetch('/api/agents', {
      headers: { 'Content-Type': 'application/json' },
      method: 'GET'
    });
    if (resp.ok) {
      const result = (await resp.json()).res;
      console.log(result);
      this.agents = result;
    } else {
      console.log("an error occured loading agents list")
    }
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
        console.log(result);

        // check if this is a known email-address. 
        // In case it is, give back forname + last name.
        this.submitResult = {
          success: true,
          editUrl:    result.editUrl,
          email:      result.email,
          customer :  result.customer,
          pin:        result.pin
        };
      } else {
        this.submitResult = {
          success: false,
          msg: resp.msg
        };
      }
    }
  }
});

new Vue({ el: '#app' });
