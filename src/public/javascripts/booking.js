// ---------------------------------------------------------------------------
// Sprachen / languages / idiomas (de | en | es)
//
// Alle sichtbaren Texte des Kundenformulars stehen hier. Gespeicherte Werte
// (z. B. Möblierung, "Wie haben Sie von uns erfahren?", Raum-IDs) bleiben
// unverändert deutsch – übersetzt wird nur die Anzeige (tOpt).
// Fehlt ein Text in einer Sprache, wird der deutsche angezeigt.
// ---------------------------------------------------------------------------
var I18N = {
  de: {
    'lang.label': 'Sprache',
    'nav.brand': 'Gleis 21 Buchungssystem',

    's1.title': '1. Veranstaltung:',
    's1.name': 'Veranstaltungstitel/Art der Veranstaltung:',
    's1.count': 'Gesamtteilnehmerzahl (inklusive Publikum und Künstler) – max: 100.',
    's1.org': 'Organisation/Firma',
    's1.ngo': 'Die oben genannte Organisation ist eine NPO (nicht gewinnorientierte Organisation).',

    's2.title': '2. Ansprechperson:',
    's2.firstName': 'Vorname',
    's2.lastName': 'Nachname',
    's2.email': 'E-Mail-Adresse',
    's2.tel': 'Telefonnummer',

    's3.title': '3. Rechnungsadresse:',
    's3.street': 'Straße',
    's3.hno': 'Hausnummer',
    's3.ano': 'Top',
    's3.postcode': 'PLZ',
    's3.city': 'Ort',
    's3.uid': 'UID-Nummer',

    's4.title': '4. Informationen zu den Räumlichkeiten:',
    's4.plan': 'Raumplan:',
    's4.variants': 'Raumvarianten:',
    's4.gross.size': '-> Veranstaltungsraum 117 m² (max. 100 Personen*)',
    's4.klein.size': '-> Veranstaltungsraum 84 m² (max. 85 Personen*)',
    's4.salon.size': '-> Veranstaltungsraum 33 m² (max. 15 Personen*)',
    's4.foyer': '-> Foyer (zusätzliche 38 m²) inkludiert',
    's4.station': '-> Station** (zusätzliche 15 m²) inkludiert',
    's4.klein.wall': '-> flexible Trennwand zum Salon (bei Bedarf) (siehe Raumplan oben)',
    's4.salon.wall': '-> flexible Trennwand zum Saal klein (bei Bedarf) (siehe Raumplan oben)',
    's4.note1': '* max. Personenanzahl hängt stark von der Möblierung ab! (bitte klären Sie das mit der Ansprechperson)',
    's4.note2': '** kann als Medienraum/Backstage/Workspaces verwendet werden',
    's4.note3': 'Es können auch zusätzliche Räume (23 m², 24 m², 13 m²) im Untergeschoß zur Verfügung gestellt werden (bitte fragen Sie bei der Ansprechperson an)',
    's4.layouts': 'Möblierungen',

    'room.Saal groß': 'Saal groß',
    'room.Saal klein': 'Saal klein',
    'room.Salon': 'Salon',

    'moebl.Ohne Möblierung': 'Ohne Möblierung',
    'moebl.Block': 'Block',
    'moebl.Cafe': 'Cafe',
    'moebl.Carre': 'Carre',
    'moebl.Geschwungene-Reihen': 'Geschwungene Reihen',
    'moebl.Geschwungene Reihen': 'Geschwungene Reihen',
    'moebl.Kreis': 'Kreis',
    'moebl.U-Form': 'U-Form',
    'moebl.Kino': 'Kino',
    'moebl.Kino Bestuhlung': 'Kino Bestuhlung',
    'moebl.Andere': 'Andere',

    's5.title': '5. Raum buchen:',
    's5.room': 'Raum',
    's5.date': 'Datum:',
    's5.begin': 'Beginn der Raumnutzung (inkl. Ihrer eigenen Vorbereitung):',
    's5.end': 'Ende der Raumnutzung (inkl. Abbau):',
    's5.delete': 'Termin entfernen',
    's5.halfDay': 'Bitte beachten Sie: Der <b>Halbtagstarif</b> gilt für Einmietungen von <b>bis zu 5 Stunden (inkl. Ihrer eigenen Vorbereitung, Auf- und Abbau)</b> und abends ab <b>17 Uhr</b>. Buchungen während des Tages, die <b>länger als 5 Stunden dauern</b>, werden mit dem <b>Ganztagstarif</b> verrechnet.',
    's5.multiDay': 'Wenn Sie unsere Räume an mehreren aufeinanderfolgenden Tagen während des Tages buchen, könnte dazwischen eine Abendveranstaltung stattfinden. Ihr Aufbausetting wird für den nächsten Tag von uns wiederhergestellt. Es besteht die Möglichkeit, Materialien in anderen Nebenräumen zwischenzulagern oder gegen Aufpreis eine Über-Nacht-Buchung vorzunehmen.',
    's5.layout': 'Möblierung',
    's5.notesPlaceholder': 'Bitte geben Sie hier Beginn und Ende der Veranstaltung (Uhrzeit) ein.',
    's5.hau': 'Wie haben Sie von uns erfahren?',
    's5.addSlot': 'Weitere Termine',

    'time.hour': '{h} Uhr',
    'time.minutes': '{m} Minuten',

    'hau.Website': 'Website',
    'hau.Social media': 'Social media',
    'hau.Newsletter': 'Newsletter',
    'hau.Freunde und Bekannte': 'Freunde und Bekannte',
    'hau.Google': 'Google',
    'hau.Sonstiges': 'Sonstiges',

    's6.title': '6. Ausstattung buchen:',
    's6.heading': 'Ausstattung',
    's6.p1': 'Im Grundpreis sind W-LAN, Soundsystem (nur basic), Möblierung sowie das Saalherrichten inbegriffen.',
    's6.p2': 'Papier für Flipchart und Pinnwand wird von Gleis 21 bereit gestellt. Moderationsmaterial (inkl. Stifte) bringen Sie bitte selber mit. Vielen Dank!',
    's6.p3': 'Änderungen Ihrer Ausstattungswünsche sind auch nach Vertragsabschluss möglich. Bitte teilen Sie uns jedoch Ihre <b>technischen Anforderungen so früh wie möglich</b> mit! Bestimmte Änderungen - z.B. Tonpult-Anschlüsse oder Tonwiedergabe über große Lautsprecher - <b>erfordern Techniker</b> und können bei kurzfristiger Mitteilung ggf. nicht umgesetzt werden.',
    's6.p4': '<b>Extern beauftragte Tontechniker</b> müssen vorab ein Gespräch mit unserem Haustechniker vor Ort führen, um sich mit unserem System vertraut zu machen und die <b>Anschlussmöglichkeiten externer Geräte</b> abzuklären (behördlich vorgeschriebener Vorgang).',
    's6.p5': 'Alle Angaben sind <b>Netto-Preise (exkl. USt).</b>',
    's6.floor': 'Wird am Boden gearbeitet? (z.B. Yoga, Meditation, Körperübungen)',
    's6.paint': 'Wird mit Farben gearbeitet?',

    'common.yes': 'Ja',
    'common.no': 'Nein',
    'common.notes': 'Anmerkungen',
    'common.submit': 'Absenden',

    'err.notEditable': 'Das Bearbeiten der Buchung ist nicht mehr möglich.',
    'err.unexpected': 'Ups... das hätte nie passieren sollen.',
    'err.saveFailed': 'Ups... das hätte nie passieren sollen. Bitte kontaktieren Sie uns unter hello@gleis21.wien',
    'err.name': 'Veranstaltungstitel/Art der Veranstaltung fehlt!',
    'err.participants': 'Gesamtteilnehmerzahl fehlt!',
    'err.org': 'Organisation/Firma fehlt!',
    'err.firstName': 'Ansprechperson/Vorname fehlt!',
    'err.lastName': 'Ansprechperson/Nachname fehlt!',
    'err.email': 'Ansprechperson/E-Mail-Adresse fehlt!',
    'err.tel': 'Ansprechperson/Telefonnummer fehlt!',
    'err.street': 'Ansprechperson/Straße fehlt!',
    'err.hno': 'Ansprechperson/Hausnummer fehlt!',
    'err.postcode': 'Ansprechperson/PLZ fehlt!',
    'err.city': 'Ansprechperson/Stadt fehlt!',
    'err.slotOrder': 'Zeitraum Nr. {n} ist ungültig. Bitte überprüfen Sie, ob das Ende nicht vor dem Beginn liegt.',
    'err.slotMaxEnd': 'Zeitraum Nr. {n} ist ungültig. Das Ende darf maximal 00:30 sein.',
    'ok.saved': 'Ihre Buchung wurde erfolgreich gespeichert! Bitte beachten Sie, dass die Reservierung erst durch Bestätigung des Vertrages fixiert wird. Ein Link zum Vertrag wird Ihnen per E-Mail übermittelt.'
  },

  en: {
    'lang.label': 'Language',
    'nav.brand': 'Gleis 21 booking system',

    's1.title': '1. Event:',
    's1.name': 'Event title / type of event:',
    's1.count': 'Total number of participants (including audience and performers) – max. 100.',
    's1.org': 'Organisation/company',
    's1.ngo': 'The organisation named above is a non-profit organisation (NPO).',

    's2.title': '2. Contact person:',
    's2.firstName': 'First name',
    's2.lastName': 'Last name',
    's2.email': 'Email address',
    's2.tel': 'Phone number',

    's3.title': '3. Billing address:',
    's3.street': 'Street',
    's3.hno': 'House number',
    's3.ano': 'Flat/unit (Top)',
    's3.postcode': 'Postcode',
    's3.city': 'City',
    's3.uid': 'VAT ID number (UID)',

    's4.title': '4. Information about the rooms:',
    's4.plan': 'Floor plan:',
    's4.variants': 'Room options:',
    's4.gross.size': '-> Event room 117 m² (max. 100 people*)',
    's4.klein.size': '-> Event room 84 m² (max. 85 people*)',
    's4.salon.size': '-> Event room 33 m² (max. 15 people*)',
    's4.foyer': '-> Foyer (an additional 38 m²) included',
    's4.station': '-> “Station”** (an additional 15 m²) included',
    's4.klein.wall': '-> movable partition wall to the Salon (if needed) (see floor plan above)',
    's4.salon.wall': '-> movable partition wall to the Saal klein (if needed) (see floor plan above)',
    's4.note1': '* The maximum number of people depends heavily on the furniture layout! (please clarify this with your contact person)',
    's4.note2': '** can be used as a media room, backstage area or workspace',
    's4.note3': 'Additional rooms (23 m², 24 m², 13 m²) in the basement can also be made available (please ask your contact person)',
    's4.layouts': 'Furniture layouts',

    'room.Saal groß': 'Saal groß (large hall)',
    'room.Saal klein': 'Saal klein (small hall)',
    'room.Salon': 'Salon',
    // Raum-Namen wie in Airtable (Tabelle Artikel, Ansicht Raeume)
    'room.Saal große Variante': 'Saal groß (large hall)',
    'room.Saal kleine Variante': 'Saal klein (small hall)',
    'room.Station': 'Station (media room / backstage)',
    'room.Chamäleon': 'Chameleon',
    'room.Gutschein': 'Voucher',

    'moebl.Ohne Möblierung': 'No furniture',
    'moebl.Block': 'Block',
    'moebl.Cafe': 'Café',
    'moebl.Carre': 'Carré (hollow square)',
    'moebl.Geschwungene-Reihen': 'Curved rows',
    'moebl.Geschwungene Reihen': 'Curved rows',
    'moebl.Kreis': 'Circle',
    'moebl.U-Form': 'U-shape',
    'moebl.Kino': 'Cinema',
    'moebl.Kino Bestuhlung': 'Cinema seating',
    'moebl.Andere': 'Other',

    's5.title': '5. Book a room:',
    's5.room': 'Room',
    's5.date': 'Date:',
    's5.begin': 'Start of room use (including your own preparation):',
    's5.end': 'End of room use (including dismantling):',
    's5.delete': 'Remove this date',
    's5.halfDay': 'Please note: the <b>half-day rate</b> applies to bookings of <b>up to 5 hours (including your own preparation, set-up and dismantling)</b> and to evenings from <b>5 pm</b>. Daytime bookings <b>lasting longer than 5 hours</b> are charged at the <b>full-day rate</b>.',
    's5.multiDay': 'If you book our rooms during the day on several consecutive days, an evening event may take place in between. We will restore your set-up for the next day. You can store materials in other side rooms in the meantime, or make an overnight booking for an additional charge.',
    's5.layout': 'Furniture layout',
    's5.notesPlaceholder': 'Please enter the start and end time of your event here.',
    's5.hau': 'How did you hear about us?',
    's5.addSlot': 'Add more dates',

    'time.hour': '{h} h',
    'time.minutes': '{m} minutes',

    'hau.Website': 'Website',
    'hau.Social media': 'Social media',
    'hau.Newsletter': 'Newsletter',
    'hau.Freunde und Bekannte': 'Friends and acquaintances',
    'hau.Google': 'Google',
    'hau.Sonstiges': 'Other',

    's6.title': '6. Book equipment:',
    's6.heading': 'Equipment',
    's6.p1': 'The basic price includes Wi-Fi, a sound system (basic only), furniture and setting up the room.',
    's6.p2': 'Paper for the flipchart and pinboard is provided by Gleis 21. Please bring your own facilitation materials (including markers). Thank you!',
    's6.p3': 'You can still change your equipment requests after the contract has been concluded. However, please let us know your <b>technical requirements as early as possible</b>! Certain changes – e.g. mixing desk connections or sound playback through the large speakers – <b>require a technician</b> and may not be possible at short notice.',
    's6.p4': '<b>Externally hired sound engineers</b> must meet our in-house technician on site beforehand to get to know our system and clarify the <b>connection options for external equipment</b> (required by the authorities).',
    's6.p5': 'All prices are <b>net prices (excl. VAT).</b>',
    's6.floor': 'Will activities take place on the floor? (e.g. yoga, meditation, physical exercises)',
    's6.paint': 'Will paints be used?',

    'common.yes': 'Yes',
    'common.no': 'No',
    'common.notes': 'Notes',
    'common.submit': 'Submit',

    'err.notEditable': 'This booking can no longer be edited.',
    'err.unexpected': 'Oops… that should never have happened.',
    'err.saveFailed': 'Oops… that should never have happened. Please contact us at hello@gleis21.wien',
    'err.name': 'Please enter the event title / type of event.',
    'err.participants': 'Please enter the total number of participants.',
    'err.org': 'Please enter the organisation/company.',
    'err.firstName': 'Please enter the contact person’s first name.',
    'err.lastName': 'Please enter the contact person’s last name.',
    'err.email': 'Please enter the contact person’s email address.',
    'err.tel': 'Please enter the contact person’s phone number.',
    'err.street': 'Please enter the street of the billing address.',
    'err.hno': 'Please enter the house number of the billing address.',
    'err.postcode': 'Please enter the postcode of the billing address.',
    'err.city': 'Please enter the city of the billing address.',
    'err.slotOrder': 'Date no. {n} is invalid. Please check that the end is not before the start.',
    'err.slotMaxEnd': 'Date no. {n} is invalid. The end can be no later than 00:30.',
    'ok.saved': 'Your booking has been saved successfully! Please note that the reservation only becomes binding once you have confirmed the contract. We will send you a link to the contract by email.'
  },

  es: {
    'lang.label': 'Idioma',
    'nav.brand': 'Sistema de reservas de Gleis 21',

    's1.title': '1. Evento:',
    's1.name': 'Título / tipo de evento:',
    's1.count': 'Número total de participantes (incluidos público y artistas) – máx. 100.',
    's1.org': 'Organización/empresa',
    's1.ngo': 'La organización indicada arriba es una organización sin ánimo de lucro (ONG).',

    's2.title': '2. Persona de contacto:',
    's2.firstName': 'Nombre',
    's2.lastName': 'Apellidos',
    's2.email': 'Correo electrónico',
    's2.tel': 'Teléfono',

    's3.title': '3. Dirección de facturación:',
    's3.street': 'Calle',
    's3.hno': 'Número',
    's3.ano': 'Piso/puerta (Top)',
    's3.postcode': 'Código postal',
    's3.city': 'Ciudad',
    's3.uid': 'Número de IVA (UID)',

    's4.title': '4. Información sobre las salas:',
    's4.plan': 'Plano de las salas:',
    's4.variants': 'Opciones de sala:',
    's4.gross.size': '-> Sala de eventos de 117 m² (máx. 100 personas*)',
    's4.klein.size': '-> Sala de eventos de 84 m² (máx. 85 personas*)',
    's4.salon.size': '-> Sala de eventos de 33 m² (máx. 15 personas*)',
    's4.foyer': '-> Foyer (38 m² adicionales) incluido',
    's4.station': '-> «Station»** (15 m² adicionales) incluida',
    's4.klein.wall': '-> tabique móvil hacia el Salon (si es necesario) (ver plano arriba)',
    's4.salon.wall': '-> tabique móvil hacia la Saal klein (si es necesario) (ver plano arriba)',
    's4.note1': '* ¡El número máximo de personas depende mucho de la disposición del mobiliario! (por favor, consúltelo con su persona de contacto)',
    's4.note2': '** puede utilizarse como sala de medios, backstage o espacio de trabajo',
    's4.note3': 'También podemos poner a su disposición salas adicionales (23 m², 24 m², 13 m²) en el sótano (por favor, consulte a su persona de contacto)',
    's4.layouts': 'Disposiciones del mobiliario',

    'room.Saal groß': 'Saal groß (sala grande)',
    'room.Saal klein': 'Saal klein (sala pequeña)',
    'room.Salon': 'Salon (salón)',
    // Nombres de sala como en Airtable (tabla Artikel, vista Raeume)
    'room.Saal große Variante': 'Saal groß (sala grande)',
    'room.Saal kleine Variante': 'Saal klein (sala pequeña)',
    'room.Station': 'Station (sala de medios / backstage)',
    'room.Chamäleon': 'Camaleón',
    'room.Gutschein': 'Vale',

    'moebl.Ohne Möblierung': 'Sin mobiliario',
    'moebl.Block': 'Bloque',
    'moebl.Cafe': 'Café',
    'moebl.Carre': 'Carré (cuadrado)',
    'moebl.Geschwungene-Reihen': 'Filas curvas',
    'moebl.Geschwungene Reihen': 'Filas curvas',
    'moebl.Kreis': 'Círculo',
    'moebl.U-Form': 'Forma de U',
    'moebl.Kino': 'Cine',
    'moebl.Kino Bestuhlung': 'Estilo cine',
    'moebl.Andere': 'Otra',

    's5.title': '5. Reservar sala:',
    's5.room': 'Sala',
    's5.date': 'Fecha:',
    's5.begin': 'Inicio del uso de la sala (incluida su propia preparación):',
    's5.end': 'Fin del uso de la sala (incluido el desmontaje):',
    's5.delete': 'Eliminar esta fecha',
    's5.halfDay': 'Tenga en cuenta: la <b>tarifa de medio día</b> se aplica a reservas de <b>hasta 5 horas (incluidos su propia preparación, montaje y desmontaje)</b> y por la tarde-noche a partir de las <b>17:00</b>. Las reservas durante el día que <b>duren más de 5 horas</b> se facturan con la <b>tarifa de día completo</b>.',
    's5.multiDay': 'Si reserva nuestras salas durante el día en varios días consecutivos, es posible que entre medias se celebre un evento por la tarde-noche. Nosotros volveremos a preparar su montaje para el día siguiente. Existe la posibilidad de guardar materiales en otras salas anexas o, con un recargo, reservar también la noche.',
    's5.layout': 'Disposición del mobiliario',
    's5.notesPlaceholder': 'Indique aquí la hora de inicio y de fin de su evento.',
    's5.hau': '¿Cómo nos conoció?',
    's5.addSlot': 'Añadir más fechas',

    'time.hour': '{h} h',
    'time.minutes': '{m} minutos',

    'hau.Website': 'Sitio web',
    'hau.Social media': 'Redes sociales',
    'hau.Newsletter': 'Boletín (newsletter)',
    'hau.Freunde und Bekannte': 'Amigos y conocidos',
    'hau.Google': 'Google',
    'hau.Sonstiges': 'Otro',

    's6.title': '6. Reservar equipamiento:',
    's6.heading': 'Equipamiento',
    's6.p1': 'El precio base incluye wifi, sistema de sonido (solo básico), mobiliario y la preparación de la sala.',
    's6.p2': 'Gleis 21 pone a su disposición el papel para el rotafolio y el tablón de corcho. Por favor, traiga usted mismo el material de moderación (incluidos los rotuladores). ¡Muchas gracias!',
    's6.p3': 'Puede modificar el equipamiento solicitado incluso después de firmar el contrato. No obstante, comuníquenos sus <b>requisitos técnicos lo antes posible</b>. Algunos cambios –p. ej., conexiones a la mesa de mezclas o reproducción de sonido por los altavoces grandes– <b>requieren un técnico</b> y, si se comunican con poca antelación, es posible que no puedan realizarse.',
    's6.p4': 'Los <b>técnicos de sonido contratados externamente</b> deben reunirse antes in situ con nuestro técnico de la casa para familiarizarse con nuestro sistema y aclarar las <b>posibilidades de conexión de equipos externos</b> (procedimiento exigido por las autoridades).',
    's6.p5': 'Todos los precios son <b>precios netos (IVA no incluido).</b>',
    's6.floor': '¿Se realizarán actividades en el suelo? (p. ej., yoga, meditación, ejercicios corporales)',
    's6.paint': '¿Se trabajará con pinturas?',

    'common.yes': 'Sí',
    'common.no': 'No',
    'common.notes': 'Observaciones',
    'common.submit': 'Enviar',

    'err.notEditable': 'Esta reserva ya no se puede modificar.',
    'err.unexpected': 'Vaya… esto no debería haber pasado.',
    'err.saveFailed': 'Vaya… esto no debería haber pasado. Por favor, póngase en contacto con nosotros en hello@gleis21.wien',
    'err.name': 'Por favor, indique el título / tipo de evento.',
    'err.participants': 'Por favor, indique el número total de participantes.',
    'err.org': 'Por favor, indique la organización/empresa.',
    'err.firstName': 'Por favor, indique el nombre de la persona de contacto.',
    'err.lastName': 'Por favor, indique los apellidos de la persona de contacto.',
    'err.email': 'Por favor, indique el correo electrónico de la persona de contacto.',
    'err.tel': 'Por favor, indique el teléfono de la persona de contacto.',
    'err.street': 'Por favor, indique la calle de la dirección de facturación.',
    'err.hno': 'Por favor, indique el número de la dirección de facturación.',
    'err.postcode': 'Por favor, indique el código postal de la dirección de facturación.',
    'err.city': 'Por favor, indique la ciudad de la dirección de facturación.',
    'err.slotOrder': 'La fecha n.º {n} no es válida. Compruebe que el fin no sea anterior al inicio.',
    'err.slotMaxEnd': 'La fecha n.º {n} no es válida. El fin puede ser como máximo a las 00:30.',
    'ok.saved': '¡Su reserva se ha guardado correctamente! Tenga en cuenta que la reserva solo será definitiva una vez que usted haya confirmado el contrato. Le enviaremos un enlace al contrato por correo electrónico.'
  }
};

// ---------------------------------------------------------------------------
// Ausstattung (Airtable-Tabelle Artikel, Ansicht Ausstattung)
//
// Name, Beschreibung und TitelAnmerkung kommen aus Airtable und sind deutsch.
// Hier stehen die Übersetzungen, gesucht nach dem deutschen Key (getrimmt).
// Gespeichert wird weiter über die id. Die Übersetzung von Beschreibung bzw.
// TitelAnmerkung wird nur gezeigt, wenn der deutsche Text in Airtable noch
// genau so lautet wie unten unter "de" – ändert sich z. B. ein Preis in
// Airtable, erscheint der neue deutsche Text statt einer veralteten
// Übersetzung. Dann hier "de", "en" und "es" nachziehen.
// ---------------------------------------------------------------------------
var EQUIPMENT_I18N = [
  {
    de: { name: 'Flipchart', description: 'Jedes zusätzliches Flipchart EUR 10,- pro Stück' },
    en: { name: 'Flipchart', description: 'Each additional flipchart EUR 10,- per piece' },
    es: { name: 'Rotafolio (flipchart)', description: 'Cada rotafolio adicional EUR 10,- por unidad' }
  },
  {
    de: { name: 'Getränkewagen (Kaffee, Tee, Milch, Wasser)', description: 'Ganztag: 4€/Person, Halbtag/Abend: 3€/Person' },
    en: { name: 'Drinks trolley (coffee, tea, milk, water)', description: 'Full day: 4€/person, half day/evening: 3€/person' },
    es: { name: 'Carrito de bebidas (café, té, leche, agua)', description: 'Día completo: 4€/persona, medio día/noche: 3€/persona' }
  },
  {
    de: { name: 'Stühle' },
    en: { name: 'Chairs' },
    es: { name: 'Sillas' }
  },
  {
    de: { name: 'Beamer (Bitte stellen Sie sicher, dass Ihr Laptop über einen HDMI-Anschluss verfügt)', description: 'Zusätzlicher Beamer: EUR 30,-' },
    en: { name: 'Projector (please make sure your laptop has an HDMI port)', description: 'Additional projector: EUR 30,-' },
    es: { name: 'Proyector (asegúrese de que su portátil tenga una conexión HDMI)', description: 'Proyector adicional: EUR 30,-' }
  },
  {
    de: { name: 'Tische' },
    en: { name: 'Tables' },
    es: { name: 'Mesas' }
  },
  {
    de: { name: 'Pinnwand', description: 'Jede zusätzliche Pinnwand EUR 10,- pro Stück' },
    en: { name: 'Pinboard', description: 'Each additional pinboard EUR 10,- per piece' },
    es: { name: 'Tablero de corcho', description: 'Cada tablero adicional EUR 10,- por unidad' }
  },
  {
    de: {
      name: 'Gesangsmikrofone Shure Beta 58 (max 4)  / Schwanenhalsmikrofone (max 4)',
      description: 'Zusätzliche  Mikrofone (inkl. Mischpult) Pauschale: 50€',
      notesTitle: 'Bitte geben Sie ein wie viele und welche Mikrofonart benötigt wird.'
    },
    en: {
      name: 'Vocal microphones Shure Beta 58 (max 4) / gooseneck microphones (max 4)',
      description: 'Additional microphones (incl. mixing desk) flat rate: 50€',
      notesTitle: 'Please tell us how many microphones you need and of which type.'
    },
    es: {
      name: 'Micrófonos vocales Shure Beta 58 (máx. 4) / micrófonos de cuello de cisne (máx. 4)',
      description: 'Micrófonos adicionales (incl. mesa de mezclas) tarifa plana: 50€',
      notesTitle: 'Indique cuántos micrófonos necesita y de qué tipo.'
    }
  },
  {
    de: { name: 'Bühnenelemente', description: '100 x 200cm, max. 9 Stk. Kosten: EUR 50,-', notesTitle: 'Bitte geben Sie ein wie viele Bühnenelemente werden benötigt.' },
    en: { name: 'Stage platforms', description: '100 x 200cm, max. 9 pieces. Cost: EUR 50,-', notesTitle: 'Please tell us how many stage platforms you need.' },
    es: { name: 'Módulos de escenario', description: '100 x 200cm, máx. 9 unidades. Coste: EUR 50,-', notesTitle: 'Indique cuántos módulos de escenario necesita.' }
  },
  {
    de: { name: 'Spesenersatz für Werbepaket kultur', description: 'Kosten: EUR 50,-' },
    en: { name: 'Expense reimbursement for the culture promotion package', description: 'Cost: EUR 50,-' },
    es: { name: 'Reembolso de gastos del paquete de promoción cultural', description: 'Coste: EUR 50,-' }
  },
  {
    de: { name: 'Ich benötige eine technische Betreuung der Ton- und Lichtanlage/Tontechniker. Preis auf Anfrage.' },
    en: { name: 'I need technical support for the sound and lighting system / a sound engineer. Price on request.' },
    es: { name: 'Necesito asistencia técnica para el equipo de sonido e iluminación / un técnico de sonido. Precio a consultar.' }
  },
  {
    de: { name: 'Funkmikrofon(2x)', description: 'Ein Mikrofon ist im Preis inkludiert. Zweites Funkmikrofon EUR 10,- pro Stück' },
    en: { name: 'Wireless microphone (2x)', description: 'One microphone is included in the price. Second wireless microphone EUR 10,- per piece' },
    es: { name: 'Micrófono inalámbrico (2x)', description: 'Un micrófono está incluido en el precio. Segundo micrófono inalámbrico EUR 10,- por unidad' }
  },
  {
    de: { name: 'Tischtücher', description: 'Kosten: EUR 10,- / Stück' },
    en: { name: 'Tablecloths', description: 'Cost: EUR 10,- / piece' },
    es: { name: 'Manteles', description: 'Coste: EUR 10,- / unidad' }
  },
  {
    de: { name: 'Tischhussen', description: 'Kosten: EUR 10,- / Stück' },
    en: { name: 'Table covers (stretch)', description: 'Cost: EUR 10,- / piece' },
    es: { name: 'Fundas para mesa', description: 'Coste: EUR 10,- / unidad' }
  },
  {
    de: { name: 'White Board' },
    en: { name: 'Whiteboard' },
    es: { name: 'Pizarra blanca' }
  },
  {
    de: { name: 'Stehtische' },
    en: { name: 'Standing tables' },
    es: { name: 'Mesas altas' }
  },
  {
    de: { name: 'Gläser', description: 'Wasser Gläser' },
    en: { name: 'Glasses', description: 'Water glasses' },
    es: { name: 'Vasos', description: 'Vasos de agua' }
  },
  {
    de: { name: 'Heurigengarnituren', description: '1 Set = 1 Tisch + 2 Bänke (max. 4 Sets)' },
    en: { name: 'Beer tent sets (table + benches)', description: '1 set = 1 table + 2 benches (max. 4 sets)' },
    es: { name: 'Conjuntos de mesa y bancos', description: '1 conjunto = 1 mesa + 2 bancos (máx. 4 conjuntos)' }
  },
  {
    de: {
      name: 'Wein- und/oder Sektgläser',
      description: 'Max. 50 Stück je Glasart. Bitte genaue Anzahl der gewünschten Wein- und Sektgläser in den Anmerkungen angeben. Kosten: EUR 40,- pauschal.',
      notesTitle: 'max. 50 Stück je Glasart. Bitte genaue Anzahl der gewünschten Wein- und Sektgläser in den Anmerkungen angeben. Kosten: EUR 40,- pauschal.'
    },
    en: {
      name: 'Wine and/or sparkling wine glasses',
      description: 'Max. 50 per type of glass. Please state the exact number of wine and sparkling wine glasses you need in the notes. Cost: EUR 40,- flat rate.',
      notesTitle: 'max. 50 per type of glass. Please state the exact number of wine and sparkling wine glasses you need in the notes. Cost: EUR 40,- flat rate.'
    },
    es: {
      name: 'Copas de vino y/o de espumoso',
      description: 'Máx. 50 unidades por tipo de copa. Indique en las observaciones el número exacto de copas de vino y de espumoso que necesita. Coste: EUR 40,- tarifa plana.',
      notesTitle: 'máx. 50 unidades por tipo de copa. Indique en las observaciones el número exacto de copas de vino y de espumoso que necesita. Coste: EUR 40,- tarifa plana.'
    }
  }
];

// Leerzeichen (auch doppelte, am Ende, geschützte) für den Vergleich vereinheitlichen
function normText(text) {
  return String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
}

var EQUIPMENT_BY_NAME = {};
EQUIPMENT_I18N.forEach(function (entry) {
  EQUIPMENT_BY_NAME[normText(entry.de.name)] = entry;
});

// Anzeige eines Ausstattungs-Felds (name | description | notesTitle) in der
// gewählten Sprache; ohne passende Übersetzung der Originaltext aus Airtable.
function translateEquipment(lang, item, field) {
  var original = item[field];
  if (lang === 'de' || !original) {
    return original;
  }
  var entry = EQUIPMENT_BY_NAME[normText(item.name)];
  if (!entry || !entry[lang] || !entry[lang][field]) {
    return original;
  }
  if (field !== 'name' && normText(entry.de[field]) !== normText(original)) {
    return original;
  }
  return entry[lang][field];
}

var LANGUAGES = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' }
];
var LANG_STORAGE_KEY = 'chopsuey-lang';

function isSupportedLang(code) {
  return LANGUAGES.some(function (l) { return l.code === code; });
}

// Reihenfolge: ?lang=en|es|de im Link > gemerkte Wahl > Deutsch
function detectLang() {
  try {
    var fromUrl = (new URLSearchParams(window.location.search).get('lang') || '').toLowerCase();
    if (isSupportedLang(fromUrl)) {
      saveLang(fromUrl);
      return fromUrl;
    }
  } catch (e) { /* ignore */ }
  try {
    var stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (isSupportedLang(stored)) {
      return stored;
    }
  } catch (e) { /* localStorage nicht verfügbar */ }
  return 'de';
}

function saveLang(code) {
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, code);
  } catch (e) { /* localStorage nicht verfügbar */ }
}

function translate(lang, key, params) {
  var dict = I18N[lang] || I18N.de;
  var text = Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : I18N.de[key];
  if (text === undefined) {
    return key;
  }
  if (params) {
    Object.keys(params).forEach(function (p) {
      text = text.split('{' + p + '}').join(params[p]);
    });
  }
  return text;
}

Vue.mixin({
  methods: {
    // t('schluessel') – Text in der gewählten Sprache
    t: function (key, params) {
      return translate(this.$root.lang, key, params);
    },
    // tOpt('moebl', 'Kreis') – Anzeige für einen gespeicherten Wert; unbekannte Werte unverändert
    tOpt: function (group, value) {
      var key = group + '.' + String(value).trim();
      var text = translate(this.$root.lang, key);
      return text === key ? value : text;
    },
    // tEquip(e, 'name' | 'description' | 'notesTitle') – Ausstattung aus Airtable
    tEquip: function (item, field) {
      return translateEquipment(this.$root.lang, item, field);
    }
  }
});

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
        timeSlots: [],
        isNGO: false,
        hau: '',
        workTypeFloor: false,
        workTypePaint: false
      },
      moeblierungen: ['Ohne Möblierung', 'Block', 'Cafe', 'Carre', 'Geschwungene-Reihen', 'Kreis', 'U-Form', 'Kino Bestuhlung', 'Andere'],
      hauOptions: [
        'Website',
        'Social media',
        'Newsletter',
        'Freunde und Bekannte',
        'Google',
        'Sonstiges'
      ],
      rooms: [],
      equipment: [],
      hours: [
        0,
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

    const booking = await (await fetch('/buchungssystem/api/bookings/' + id)).json();
    if (booking.err) {
      if (booking.err === 1001) {
        this.error = 'err.notEditable';
      } else {
        this.error = 'err.unexpected';
      }
    } else {
      const roomsRes = await (await fetch('/buchungssystem/api/bookings/' + id + '/availablerooms', {
        method: 'get'
      })).json();
      const equipmentRes = await (await fetch('/buchungssystem/api/bookings/' + id + '/availableequipment', {
        method: 'get'
      })).json();
      const bookedEquipmentRes = await (await fetch('/buchungssystem/api/bookings/' + id + '/bookedequipment', {
        method: 'get'
      })).json();
      const timeslotsRes = await (await fetch('/buchungssystem/api/bookings/' + id + '/eventtimeslots', {
        method: 'get'
      })).json();

      this.rooms = roomsRes.res;
      this.booking.equipment = equipmentRes.res.map(e => {
        const bookedEqp = bookedEquipmentRes.res.find(r => r.equipmentId === e.id);
        return {
          id: e.id,
          name: e.name,
          count: bookedEqp ? bookedEqp.numberBooked : 0,
          description: e.description,
          quantity: e.quantity,
          position: e.position,
          notesTitle: e.notesTitle,
          notes: bookedEqp ? bookedEqp.notes : null
        };
      }).sort((a, b) => a.position - b.position);
      if (timeslotsRes.res && timeslotsRes.res.length > 0) {
        this.booking.timeSlots = timeslotsRes.res
      } else {
        this.booking.timeSlots = [
          {
            id: 1,
            roomId: this.rooms[0].id,
            type: 'Veranstaltung',
            moeblierung: 'Kreis',
            beginnDate: moment()
              .add(2, 'd')
              .format('YYYY-MM-DD'),
            beginnH: 9,
            beginnM: 0,
            endH: 17,
            endM: 0,
            notes: ''
          }
        ];
      }
      if (booking && booking.participantsCount > 1) {
        this.booking.participantsCount = booking.participantsCount;
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
      if (!this.booking.name) {
        this.submitResult = {
          success: false,
          key: 'err.name'
        };
        return;
      }
      if (!this.booking.participantsCount) {
        this.submitResult = {
          success: false,
          key: 'err.participants'
        };
        return;
      }
      if (!this.booking.person.org) {
        this.submitResult = {
          success: false,
          key: 'err.org'
        };
        return;
      }
      if (!this.booking.person.firstName) {
        this.submitResult = {
          success: false,
          key: 'err.firstName'
        };
        return;
      }
      if (!this.booking.person.lastName) {
        this.submitResult = {
          success: false,
          key: 'err.lastName'
        };
        return;
      }
      if (!this.booking.person.email) {
        this.submitResult = {
          success: false,
          key: 'err.email'
        };
        return;
      }
      if (!this.booking.person.tel) {
        this.submitResult = {
          success: false,
          key: 'err.tel'
        };
        return;
      }

      if (!this.booking.person.street) {
        this.submitResult = {
          success: false,
          key: 'err.street'
        };
        return;
      }
      if (!this.booking.person.hno) {
        this.submitResult = {
          success: false,
          key: 'err.hno'
        };
        return;
      }
      if (!this.booking.person.postcode) {
        this.submitResult = {
          success: false,
          key: 'err.postcode'
        };
        return;
      }
      if (!this.booking.person.city) {
        this.submitResult = {
          success: false,
          key: 'err.city'
        };
        return;
      }
      
      const invalidTimeSlotIndex = this.booking.timeSlots.findIndex(ts => {
        const beginn = moment(ts.beginnDate)
          .add(ts.beginnH, 'h')
          .add(ts.beginnM, 'minutes');

        const end = moment(ts.beginnDate)
          .add(ts.endH, 'h')
          .add(ts.endM, 'minutes');

        return end.isBefore(beginn)
      });
      if (invalidTimeSlotIndex > -1) {
        this.submitResult = {
          success: false,
          key: 'err.slotOrder',
          params: { n: invalidTimeSlotIndex + 1 }
        };
        return;
      }

      const maxEndExceededTimeSlotIndex = this.booking.timeSlots.findIndex(ts => {
        const end = moment(ts.beginnDate)
          .add(ts.endH, 'h')
          .add(ts.endM, 'minutes');

        const maxEnd = moment(ts.beginnDate)
          .add(1, 'days')
          .add(30, 'minutes');
        return end.isAfter(maxEnd);
      });
      if (maxEndExceededTimeSlotIndex > -1) {
        this.submitResult = {
          success: false,
          key: 'err.slotMaxEnd',
          params: { n: maxEndExceededTimeSlotIndex + 1 }
        };
        return;
      }
      this.loading = true;
      const b = { ...this.booking };
      b.equipment = b.equipment.filter(eq => eq.count > 0);
      const res = await fetch('/buchungssystem/api/bookings/' + this.booking.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b)
      });
      this.loading = false;
      if (res.ok) {
        this.submitResult = {
          success: true,
          key: 'ok.saved'
        };
      } else {
        this.submitResult = {
          success: false,
          key: 'err.saveFailed'
        };
      }
    }
  }
});

new Vue({
  el: '#app',
  data: {
    lang: detectLang(),
    languages: LANGUAGES
  },
  watch: {
    lang: function (code) {
      document.documentElement.lang = code;
    }
  },
  created: function () {
    document.documentElement.lang = this.lang;
  },
  methods: {
    setLang: function (code) {
      if (!isSupportedLang(code)) {
        return;
      }
      this.lang = code;
      saveLang(code);
    }
  }
});
