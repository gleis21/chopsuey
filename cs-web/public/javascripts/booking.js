function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}
Vue.component('booking-form', {
  template: '#booking-form',
  data: function () {
    return {
      initialized: false,
      initializerWidth: 20,
      submitResult: null,
      error: null,
      loading: false,
      booking: {
        person: {},
        participantsCount: 1,
        equipment: [],
        notes: '',
        timeSlots: []
      },
      rooms: [],
      equipment: [],
      hours: [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23
      ],
      mins: [0, 30]
    };
  },
  async mounted() {
    this.initializerWidth = 60;
    const pathSegments = window.location.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];

    const booking = await (await fetch('/api/bookings/' + id)).json();
    if (booking.err) {
      if (booking.err === 1001) {
        this.error = 'Das Bearbeiten der Buchung ist nicht mehr möglich.';
      } else {
        this.error = 'Ups... das hätte nie passieren sollen.';
      }
    } else {
      const roomsRes = await (await fetch('/api/bookings/' + id + '/availablerooms', { 
        method: 'get', 
        headers: new Headers({
          'Authorization': 'Basic '+getCookie('cs-creds'),
        })
      })).json();
      const equipmentRes = await (await fetch('/api/bookings/' + id + '/availableequipment', { 
        method: 'get', 
        headers: new Headers({
          'Authorization': 'Basic '+getCookie('cs-creds'),
        })
      })).json();
      const bookedEquipmentRes = await (await fetch('/api/bookings/' + id + '/bookedequipment', { 
        method: 'get', 
        headers: new Headers({
          'Authorization': 'Basic '+getCookie('cs-creds'),
        })
      })).json();
      const timeslotsRes = await (await fetch('/api/bookings/' + id + '/eventtimeslots', { 
        method: 'get', 
        headers: new Headers({
          'Authorization': 'Basic '+getCookie('cs-creds'),
        })
      })).json();

      this.rooms = roomsRes.res;
      this.booking.equipment = equipmentRes.res.map(e => {
        const bookedEqp = bookedEquipmentRes.res.filter(r => r.equipmentId === e.id);
        return { id: e.id, name: e.name, count: bookedEqp.length > 0 ? bookedEqp[0].numberBooked: 0, description: e.description };
      });
      if (timeslotsRes.res && timeslotsRes.res.length > 0) {
        this.booking.timeSlots = timeslotsRes.res
      } else {
        this.booking.timeSlots = [
          {
            id: 1,
            roomId: this.rooms[0].id,
            type: 'Veranstaltung',
            beginnDate: moment()
              .add(2, 'd')
              .format('YYYY-MM-DD'),
            beginnH: 9,
            beginnM: 0,
            endDate: moment()
              .add(2, 'd')
              .format('YYYY-MM-DD'),
            endH: 17,
            endM: 0,
            notes: ''
          }
        ];
      }
      this.booking = { ...this.booking, ...booking.res };
    }
    this.initializerWidth = 100;
    setTimeout(() => (this.initialized = true), 150);
  },
  methods: {
    addTimeSlot: function () {
      const lastRange = this.booking.timeSlots[
        this.booking.timeSlots.length - 1
      ];
      this.booking.timeSlots = [...this.booking.timeSlots, { ...lastRange }];
    },
    deleteTimeSlot: function (index) {
      this.booking.timeSlots.splice(index, 1);
    },
    submit: async function () {
      this.loading = true;
      this.booking.equipment = this.booking.equipment.filter(eq => eq.count > 0);
      const res = await fetch('/api/bookings/' + this.booking.id, {
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic '+getCookie('cs-creds') },
        method: 'PUT',
        body: JSON.stringify(this.booking)
      });
      this.loading = false;
      if (res.ok) {
        this.submitResult = {
          success: true,
          msg: 'Ihre Anfrage wurde erfolgreich gespeichert.'
        };
      } else {
        this.submitResult = {
          success: false,
          msg: 'Ups... das hätte nie passieren sollen.'
        };
      }
    }
  }
});

new Vue({ el: '#app' });
