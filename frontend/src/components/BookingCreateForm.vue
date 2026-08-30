<script setup lang="ts">
import { reactive, ref } from 'vue';
import { createBooking } from '../api';

const submitResult = ref<{ success: boolean; msg: string } | null>(null);
const loading = ref(false);
const booking = reactive({
  name: '',
  customerEmail: '',
  sendAutoMail: false
});

async function submit() {
  loading.value = true;
  const resp = await createBooking({
    name: booking.name,
    customerEmail: booking.customerEmail,
    sendAutoMail: booking.sendAutoMail
  });
  loading.value = false;
  submitResult.value = resp.err
    ? { success: false, msg: 'Ups... das hätte nie passieeren sollen.' }
    : { success: true, msg: 'LINK: ' + resp.res.editUrl + ' | ' + 'EMAIL: ' + resp.res.email + ' | ' + 'PIN: ' + resp.res.pin };
}
</script>

<template>
  <div class="container">
    <div>
      <div class="form-group">
        <label for="Name">Name der Buchung</label>
        <input type="text" required class="form-control" v-model="booking.name">
      </div>
      <div class="form-group">
        <label for="email">E-Mail-Adresse des Kunden</label>
        <input type="email" required class="form-control" v-model="booking.customerEmail">
      </div>
      <div class="form-check">
        <input type="checkbox" class="form-check-input" v-model="booking.sendAutoMail" id="sendAutoMail">
        <label class="form-check-label" for="sendAutoMail">Automatisches E-Mail senden</label>
      </div>
    </div>
    <br/>
    <div class="row">
      <div class="col-md-12">
        <div class="alert alert-success" role="alert" v-if="submitResult && submitResult.success">{{ submitResult.msg }}</div>
        <div class="alert alert-danger" role="alert" v-if="submitResult && !submitResult.success">{{ submitResult.msg }}</div>
      </div>
    </div>
    <div class="row">
      <div class="col-md-12">
        <button type="button" class="btn btn-primary" :disabled="submitResult && submitResult.success" @click="submit" style="width: 100px"><i class="fa fa-spinner fa-spin" v-if="loading"></i>{{ loading ? '' : 'Absenden' }}</button>
      </div>
    </div>
  </div>
</template>
