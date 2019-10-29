Vue.component('booking-form', {
  template: '#booking-form',
  data: function() {
    return {
      booking: {
        person: {},
        equipmentIds: [],
        roomId: '',
        eventsTimeRanges: [
          {
            id: 1,
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
            prepDurH: 1,
            prepDurM: 0,
            teardownDurH: 1,
            teardownDurM: 0
          }
        ]
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
    const pathSegments = window.location.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    const booking = await (await fetch('/api/bookings/' + id)).json();
    const room = await (await fetch('/api/rooms')).json();
    const equipment = await (await fetch('/api/equipment')).json();
    this.rooms = room.res;
    this.equipment = equipment.res;
    this.booking = { ...this.booking, ...booking.res };
    this.booking.roomId = this.rooms[0].id;
  },
  methods: {
    addTimeRange: function() {
      const lastRange = this.booking.eventsTimeRanges[
        this.booking.eventsTimeRanges.length - 1
      ];
      this.booking.eventsTimeRanges = [
        ...this.booking.eventsTimeRanges,
        { ...lastRange }
      ];
    },
    submit: function() {
      fetch('/api/bookings/' + this.booking.id, {
        headers: { 'Content-Type': 'application/json' },
        method: 'PUT',
        body: JSON.stringify(this.booking)
      });
    }
  }
});

new Vue({ el: '#app' });
