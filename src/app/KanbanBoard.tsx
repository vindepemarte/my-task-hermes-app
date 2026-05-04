"use client";

import { FormEvent, useEffect, useState } from "react";

type TaskStatus = "todo" | "in-progress" | "done";
type TaskPriority = "Low" | "Medium" | "High";

type Task = {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
};

type TaskFormState = {
  title: string;
  description: string;
  priority: TaskPriority;
};

const STORAGE_KEY = "my-task-hermes-app:tasks:prospecting-2026-05-04-v20";

const columns: Array<{
  status: TaskStatus;
  label: string;
  accent: string;
}> = [
  { status: "todo", label: "Todo", accent: "bg-amber-400" },
  { status: "in-progress", label: "In Progress", accent: "bg-sky-500" },
  { status: "done", label: "Done", accent: "bg-emerald-500" },
];

const priorityStyles: Record<TaskPriority, string> = {
  Low: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  Medium: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  High: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
};

const prospectPipelineTasks: Task[] = [
  {
    id: "prospect-1",
    title: "Dott.sa Demaria Daniela",
    description: "Categoria/Città: Ambulatorio veterinario · Asti\nGoogle Maps: https://www.google.com/maps/search/?api=1&query=44.8275113,8.1777234\nTelefono: +39 328 3068421\nSito preparato: https://client-1-dott-sa-demaria-daniela.vercel.app\nRepo GitHub: https://github.com/vindepemarte/client-1-dott-sa-demaria-daniela\nPerché selezionato: telefono presente, nessun sito ufficiale evidente nelle fonti OSM; opportunità mobile-first. prenotazioni telefoniche perse da ricerche urgenti “veterinario vicino a me” e poca fiducia senza pagina servizi\nCompetitor con presenza web: Ordine Veterinari Asti | (https://www.veterinariasti.it/); Ordine di Asti - fnovi (https://fnovi.it/ordini-provinciali/Asti?id_ordine_prov=7)\nScript primo messaggio: Buongiorno, sono Alexandru. Ho preparato una proposta concreta per Dott.sa Demaria Daniela: una pagina mobile-first curata, con contatto rapido, mappa, servizi e richiesta diretta. Posso inviarvi il link per farvela vedere?\nPrezzo raccomandato: €1.500 setup + €129/mese\nFooter applicato: Tutti i diritti riservati, sito creato da Alexandru Eugen Iacovici trading as Iacovici.it",
    priority: "High",
    status: "done",
  },
  {
    id: "prospect-2",
    title: "Assaggio d'India",
    description: "Categoria/Città: Ristorante / trattoria · Asti\nGoogle Maps: https://www.google.com/maps/search/?api=1&query=44.9049108,8.2188873\nTelefono: +39 0141 272386\nSito preparato: https://client-1-assaggio-dindia.vercel.app\nRepo GitHub: https://github.com/vindepemarte/client-1-assaggio-dindia\nPerché selezionato: telefono presente, nessun sito ufficiale evidente nelle fonti OSM; opportunità mobile-first. prenotazioni e ordini persi quando turisti/locali cercano menu, orari e WhatsApp da mobile\nCompetitor con presenza web: Home - L'Antico Casale - Ristorante Asti (https://anticocasaleasti.it/); La Regibussa Hotel e Ristorante Asti (https://www.laregibussa.it/)\nScript primo messaggio: Buongiorno, sono Alexandru. Ho preparato una proposta concreta per Assaggio d'India: una pagina mobile-first curata, con contatto rapido, mappa, servizi e richiesta diretta. Posso inviarvi il link per farvela vedere?\nPrezzo raccomandato: €1.200 setup + €99/mese\nFooter applicato: Tutti i diritti riservati, sito creato da Alexandru Eugen Iacovici trading as Iacovici.it",
    priority: "High",
    status: "done",
  },
  {
    id: "prospect-3",
    title: "Francese",
    description: "Categoria/Città: Ristorante / trattoria · Asti\nGoogle Maps: https://www.google.com/maps/search/?api=1&query=44.8993655,8.2035828\nTelefono: +39 0141 592321\nSito preparato: https://client-1-francese.vercel.app\nRepo GitHub: https://github.com/vindepemarte/client-1-francese\nPerché selezionato: telefono presente, nessun sito ufficiale evidente nelle fonti OSM; opportunità mobile-first. prenotazioni e ordini persi quando turisti/locali cercano menu, orari e WhatsApp da mobile\nCompetitor con presenza web: Home - L'Antico Casale - Ristorante Asti (https://anticocasaleasti.it/); La Regibussa Hotel e Ristorante Asti (https://www.laregibussa.it/)\nScript primo messaggio: Buongiorno, sono Alexandru. Ho preparato una proposta concreta per Francese: una pagina mobile-first curata, con contatto rapido, mappa, servizi e richiesta diretta. Posso inviarvi il link per farvela vedere?\nPrezzo raccomandato: €1.200 setup + €99/mese\nFooter applicato: Tutti i diritti riservati, sito creato da Alexandru Eugen Iacovici trading as Iacovici.it",
    priority: "High",
    status: "done",
  },
  {
    id: "prospect-4",
    title: "Il forno di Vaglierano",
    description: "Categoria/Città: Panetteria / pasticceria · Asti\nGoogle Maps: https://www.google.com/maps/search/?api=1&query=44.8781984,8.1262841\nTelefono: +39 0141200282\nSito preparato: https://client-1-il-forno-di-vaglierano.vercel.app\nRepo GitHub: https://github.com/vindepemarte/client-1-il-forno-di-vaglierano\nPerché selezionato: telefono presente, nessun sito ufficiale evidente nelle fonti OSM; opportunità mobile-first. ordini per torte, catering e festività intercettati oggi da competitor con sito e scheda chiara\nCompetitor con presenza web: panetteria Asti - Dolce Forno (https://dolcefornoasti.it/); Al Dolce Ci Penso Io - Pasticceria Asti (https://aldolcecipensoio.it/)\nScript primo messaggio: Buongiorno, sono Alexandru. Ho preparato una proposta concreta per Il forno di Vaglierano: una pagina mobile-first curata, con contatto rapido, mappa, servizi e richiesta diretta. Posso inviarvi il link per farvela vedere?\nPrezzo raccomandato: €900 setup + €79/mese\nFooter applicato: Tutti i diritti riservati, sito creato da Alexandru Eugen Iacovici trading as Iacovici.it",
    priority: "High",
    status: "done",
  },
  {
    id: "prospect-5",
    title: "Perfec7 Coaching Asti",
    description: "Categoria/Città: Palestra / coaching · Asti\nGoogle Maps: https://www.google.com/maps/search/?api=1&query=44.902135,8.2091927\nTelefono: +393332002067\nSito preparato: https://client-1-perfec7-coaching-asti.vercel.app\nRepo GitHub: https://github.com/vindepemarte/client-1-perfec7-coaching-asti\nPerché selezionato: telefono presente, nessun sito ufficiale evidente nelle fonti OSM; opportunità mobile-first. lead persi per prova gratuita, programmi e richieste WhatsApp fuori orario\nCompetitor con presenza web: Competitor locale con presenza web a Asti (https://www.google.com/search?q=palestra%20personal%20training%20Asti%20sito%20ufficiale); Competitor locale con presenza web a Asti (https://www.google.com/search?q=palestra%20personal%20training%20Asti%20sito%20ufficiale)\nScript primo messaggio: Buongiorno, sono Alexandru. Ho preparato una proposta concreta per Perfec7 Coaching Asti: una pagina mobile-first curata, con contatto rapido, mappa, servizi e richiesta diretta. Posso inviarvi il link per farvela vedere?\nPrezzo raccomandato: €1.200 setup + €99/mese\nFooter applicato: Tutti i diritti riservati, sito creato da Alexandru Eugen Iacovici trading as Iacovici.it",
    priority: "High",
    status: "done",
  },
  {
    id: "prospect-6",
    title: "El pan d'na volta",
    description: "Categoria/Città: Panetteria / pasticceria · Cuneo\nGoogle Maps: https://www.google.com/maps/search/?api=1&query=44.3902165,7.5476531\nTelefono: +39 0171 693035\nSito preparato: https://client-1-el-pan-dna-volta.vercel.app\nRepo GitHub: https://github.com/vindepemarte/client-1-el-pan-dna-volta\nPerché selezionato: telefono presente, nessun sito ufficiale evidente nelle fonti OSM; opportunità mobile-first. ordini per torte, catering e festività intercettati oggi da competitor con sito e scheda chiara\nCompetitor con presenza web: Competitor locale con presenza web a Cuneo (https://www.google.com/search?q=panetteria%20pasticceria%20Cuneo%20sito%20ufficiale); Competitor locale con presenza web a Cuneo (https://www.google.com/search?q=panetteria%20pasticceria%20Cuneo%20sito%20ufficiale)\nScript primo messaggio: Buongiorno, sono Alexandru. Ho preparato una proposta concreta per El pan d'na volta: una pagina mobile-first curata, con contatto rapido, mappa, servizi e richiesta diretta. Posso inviarvi il link per farvela vedere?\nPrezzo raccomandato: €900 setup + €79/mese\nFooter applicato: Tutti i diritti riservati, sito creato da Alexandru Eugen Iacovici trading as Iacovici.it",
    priority: "High",
    status: "done",
  },
  {
    id: "prospect-7",
    title: "L'Angolo del Pane Panetteria e Alimentari",
    description: "Categoria/Città: Panetteria / pasticceria · Cuneo\nGoogle Maps: https://www.google.com/maps/search/?api=1&query=44.4942466,7.5449612\nTelefono: +39 339 6811887\nSito preparato: https://client-1-langolo-del-pane-panetteri.vercel.app\nRepo GitHub: https://github.com/vindepemarte/client-1-langolo-del-pane-panetteria-e-alimentari\nPerché selezionato: telefono presente, nessun sito ufficiale evidente nelle fonti OSM; opportunità mobile-first. ordini per torte, catering e festività intercettati oggi da competitor con sito e scheda chiara\nCompetitor con presenza web: Competitor locale con presenza web a Cuneo (https://www.google.com/search?q=panetteria%20pasticceria%20Cuneo%20sito%20ufficiale); Competitor locale con presenza web a Cuneo (https://www.google.com/search?q=panetteria%20pasticceria%20Cuneo%20sito%20ufficiale)\nScript primo messaggio: Buongiorno, sono Alexandru. Ho preparato una proposta concreta per L'Angolo del Pane Panetteria e Alimentari: una pagina mobile-first curata, con contatto rapido, mappa, servizi e richiesta diretta. Posso inviarvi il link per farvela vedere?\nPrezzo raccomandato: €900 setup + €79/mese\nFooter applicato: Tutti i diritti riservati, sito creato da Alexandru Eugen Iacovici trading as Iacovici.it",
    priority: "High",
    status: "done",
  },
  {
    id: "prospect-8",
    title: "Trattoria dei Ronchi",
    description: "Categoria/Città: Ristorante / trattoria · Cuneo\nGoogle Maps: https://www.google.com/maps/search/?api=1&query=44.433995,7.5898115\nTelefono: +39 0171 43287\nSito preparato: https://client-1-trattoria-dei-ronchi.vercel.app\nRepo GitHub: https://github.com/vindepemarte/client-1-trattoria-dei-ronchi\nPerché selezionato: telefono presente, nessun sito ufficiale evidente nelle fonti OSM; opportunità mobile-first. prenotazioni e ordini persi quando turisti/locali cercano menu, orari e WhatsApp da mobile\nCompetitor con presenza web: Competitor locale con presenza web a Cuneo (https://www.google.com/search?q=ristorante%20Cuneo%20sito%20ufficiale); Competitor locale con presenza web a Cuneo (https://www.google.com/search?q=ristorante%20Cuneo%20sito%20ufficiale)\nScript primo messaggio: Buongiorno, sono Alexandru. Ho preparato una proposta concreta per Trattoria dei Ronchi: una pagina mobile-first curata, con contatto rapido, mappa, servizi e richiesta diretta. Posso inviarvi il link per farvela vedere?\nPrezzo raccomandato: €1.200 setup + €99/mese\nFooter applicato: Tutti i diritti riservati, sito creato da Alexandru Eugen Iacovici trading as Iacovici.it",
    priority: "High",
    status: "done",
  },
  {
    id: "prospect-9",
    title: "Pizzeria Il Portico",
    description: "Categoria/Città: Ristorante / trattoria · Cuneo\nGoogle Maps: https://www.google.com/maps/search/?api=1&query=44.3786351,7.5364142\nTelefono: +39 0171 697772\nSito preparato: https://client-1-pizzeria-il-portico.vercel.app\nRepo GitHub: https://github.com/vindepemarte/client-1-pizzeria-il-portico\nPerché selezionato: telefono presente, nessun sito ufficiale evidente nelle fonti OSM; opportunità mobile-first. prenotazioni e ordini persi quando turisti/locali cercano menu, orari e WhatsApp da mobile\nCompetitor con presenza web: Competitor locale con presenza web a Cuneo (https://www.google.com/search?q=ristorante%20Cuneo%20sito%20ufficiale); Competitor locale con presenza web a Cuneo (https://www.google.com/search?q=ristorante%20Cuneo%20sito%20ufficiale)\nScript primo messaggio: Buongiorno, sono Alexandru. Ho preparato una proposta concreta per Pizzeria Il Portico: una pagina mobile-first curata, con contatto rapido, mappa, servizi e richiesta diretta. Posso inviarvi il link per farvela vedere?\nPrezzo raccomandato: €1.200 setup + €99/mese\nFooter applicato: Tutti i diritti riservati, sito creato da Alexandru Eugen Iacovici trading as Iacovici.it",
    priority: "High",
    status: "done",
  },
  {
    id: "prospect-10",
    title: "Cielo Azzurro",
    description: "Categoria/Città: Ristorante / trattoria · Cuneo\nGoogle Maps: https://www.google.com/maps/search/?api=1&query=44.3793215,7.5371446\nTelefono: +39 0171 67345\nSito preparato: https://client-1-cielo-azzurro.vercel.app\nRepo GitHub: https://github.com/vindepemarte/client-1-cielo-azzurro\nPerché selezionato: telefono presente, nessun sito ufficiale evidente nelle fonti OSM; opportunità mobile-first. prenotazioni e ordini persi quando turisti/locali cercano menu, orari e WhatsApp da mobile\nCompetitor con presenza web: Competitor locale con presenza web a Cuneo (https://www.google.com/search?q=ristorante%20Cuneo%20sito%20ufficiale); Competitor locale con presenza web a Cuneo (https://www.google.com/search?q=ristorante%20Cuneo%20sito%20ufficiale)\nScript primo messaggio: Buongiorno, sono Alexandru. Ho preparato una proposta concreta per Cielo Azzurro: una pagina mobile-first curata, con contatto rapido, mappa, servizi e richiesta diretta. Posso inviarvi il link per farvela vedere?\nPrezzo raccomandato: €1.200 setup + €99/mese\nFooter applicato: Tutti i diritti riservati, sito creato da Alexandru Eugen Iacovici trading as Iacovici.it",
    priority: "High",
    status: "done",
  },
  {
    id: "prospect-11",
    title: "Vanity",
    description: "Categoria/Città: Parrucchiere / salone · Asti\nGoogle Maps: https://www.google.com/maps/search/?api=1&query=44.9035325,8.2155388\nTelefono: +39 324 536 9335\nSito preparato: https://client-1-vanity.vercel.app\nRepo GitHub: https://github.com/vindepemarte/client-1-vanity\nPerché selezionato: telefono presente, nessun sito ufficiale evidente nelle fonti OSM; opportunità mobile-first. appuntamenti persi quando clienti cercano foto, servizi e disponibilità ma trovano solo schede o social non aggiornati\nCompetitor con presenza web: Salone competitor online (https://www.google.com/search?q=parrucchiere+sito+ufficiale+Piemonte); Parrucchiere con booking online (https://www.google.com/search?q=salone+parrucchiere+prenotazione+online+Piemonte)\nScript primo messaggio: Buongiorno, sono Alexandru. Ho preparato una proposta concreta per Vanity: una pagina mobile-first curata, con contatto rapido, mappa, servizi e richiesta diretta. Posso inviarvi il link per farvela vedere?\nPrezzo raccomandato: €1.000 setup + €89/mese\nFooter applicato: Tutti i diritti riservati, sito creato da Alexandru Eugen Iacovici trading as Iacovici.it",
    priority: "High",
    status: "done",
  },
  {
    id: "prospect-12",
    title: "Sun&Beauty",
    description: "Categoria/Città: Centro estetico · Asti\nGoogle Maps: https://www.google.com/maps/search/?api=1&query=44.9149862,8.2264203\nTelefono: +39 0141 273 323\nSito preparato: https://client-1-sun-beauty.vercel.app\nRepo GitHub: https://github.com/vindepemarte/client-1-sun-beauty\nPerché selezionato: telefono presente, nessun sito ufficiale evidente nelle fonti OSM; opportunità mobile-first. richieste perse da persone che confrontano trattamenti, prezzi indicativi e disponibilità prima di chiamare\nCompetitor con presenza web: Centro estetico competitor (https://www.google.com/search?q=centro+estetico+sito+ufficiale+Piemonte); Beauty salon online (https://www.google.com/search?q=centro+benessere+prenotazione+online+Piemonte)\nScript primo messaggio: Buongiorno, sono Alexandru. Ho preparato una proposta concreta per Sun&Beauty: una pagina mobile-first curata, con contatto rapido, mappa, servizi e richiesta diretta. Posso inviarvi il link per farvela vedere?\nPrezzo raccomandato: €1.100 setup + €89/mese\nFooter applicato: Tutti i diritti riservati, sito creato da Alexandru Eugen Iacovici trading as Iacovici.it",
    priority: "High",
    status: "done",
  },
  {
    id: "prospect-13",
    title: "DentalBio - Asti",
    description: "Categoria/Città: Studio dentistico · Asti\nGoogle Maps: https://www.google.com/maps/search/?api=1&query=44.9036923,8.2169134\nTelefono: +39 0141 532616\nSito preparato: https://client-1-dentalbio-asti.vercel.app\nRepo GitHub: https://github.com/vindepemarte/client-1-dentalbio-asti\nPerché selezionato: telefono presente, nessun sito ufficiale evidente nelle fonti OSM; opportunità mobile-first. nuovi pazienti persi quando cercano uno studio vicino e trovano solo directory senza una pagina autorevole\nCompetitor con presenza web: Studio dentistico competitor (https://www.google.com/search?q=studio+dentistico+sito+ufficiale+Piemonte); Dentista con presenza web (https://www.google.com/search?q=dentista+sito+ufficiale+Piemonte)\nScript primo messaggio: Buongiorno, sono Alexandru. Ho preparato una proposta concreta per DentalBio - Asti: una pagina mobile-first curata, con contatto rapido, mappa, servizi e richiesta diretta. Posso inviarvi il link per farvela vedere?\nPrezzo raccomandato: €1.800 setup + €149/mese\nFooter applicato: Tutti i diritti riservati, sito creato da Alexandru Eugen Iacovici trading as Iacovici.it",
    priority: "High",
    status: "done",
  },
  {
    id: "prospect-14",
    title: "Fiandra Patrizia",
    description: "Categoria/Città: Ambulatorio veterinario · Torino\nGoogle Maps: https://www.google.com/maps/search/?api=1&query=45.0809023,7.6424922\nTelefono: +39 011 7493472\nSito preparato: https://client-1-fiandra-patrizia.vercel.app\nRepo GitHub: https://github.com/vindepemarte/client-1-fiandra-patrizia\nPerché selezionato: telefono presente, nessun sito ufficiale evidente nelle fonti OSM; opportunità mobile-first. contatti persi da ricerche urgenti “veterinario vicino a me” quando mancano servizi, orari e fiducia online\nCompetitor con presenza web: Ordine Veterinari Asti (https://www.veterinariasti.it/); FNOVI Asti (https://fnovi.it/ordini-provinciali/Asti?id_ordine_prov=7)\nScript primo messaggio: Buongiorno, sono Alexandru. Ho preparato una proposta concreta per Fiandra Patrizia: una pagina mobile-first curata, con contatto rapido, mappa, servizi e richiesta diretta. Posso inviarvi il link per farvela vedere?\nPrezzo raccomandato: €1.500 setup + €129/mese\nFooter applicato: Tutti i diritti riservati, sito creato da Alexandru Eugen Iacovici trading as Iacovici.it",
    priority: "High",
    status: "done",
  },
  {
    id: "prospect-15",
    title: "Club Trapani",
    description: "Categoria/Città: Palestra / coaching · Torino\nGoogle Maps: https://www.google.com/maps/search/?api=1&query=45.0720394,7.6403618\nTelefono: +39 011 33 7109\nSito preparato: https://client-1-club-trapani.vercel.app\nRepo GitHub: https://github.com/vindepemarte/client-1-club-trapani\nPerché selezionato: telefono presente, nessun sito ufficiale evidente nelle fonti OSM; opportunità mobile-first. lead persi per prove gratuite, programmi e richieste fuori orario non raccolte in modo ordinato\nCompetitor con presenza web: Palestra area locale (https://www.google.com/search?q=palestra+personal+training+sito+ufficiale); Fitness competitor online (https://www.google.com/search?q=fitness+coach+sito+ufficiale+Piemonte)\nScript primo messaggio: Buongiorno, sono Alexandru. Ho preparato una proposta concreta per Club Trapani: una pagina mobile-first curata, con contatto rapido, mappa, servizi e richiesta diretta. Posso inviarvi il link per farvela vedere?\nPrezzo raccomandato: €1.200 setup + €99/mese\nFooter applicato: Tutti i diritti riservati, sito creato da Alexandru Eugen Iacovici trading as Iacovici.it",
    priority: "High",
    status: "done",
  },
  {
    id: "prospect-16",
    title: "La Panetteria di Santina",
    description: "Categoria/Città: Panetteria / pasticceria · Asti\nGoogle Maps: https://www.google.com/maps/search/?api=1&query=44.8994823,8.1944089\nTelefono: +39 340 569 2096\nSito preparato: https://client-1-la-panetteria-di-santina.vercel.app\nRepo GitHub: https://github.com/vindepemarte/client-1-la-panetteria-di-santina\nPerché selezionato: telefono presente, nessun sito ufficiale evidente nelle fonti OSM; opportunità mobile-first. ordini per torte, catering e festività intercettati oggi da attività con sito e scheda più chiara\nCompetitor con presenza web: Dolce Forno Asti (https://dolcefornoasti.it/); Al Dolce Ci Penso Io (https://aldolcecipensoio.it/)\nScript primo messaggio: Buongiorno, sono Alexandru. Ho preparato una proposta concreta per La Panetteria di Santina: una pagina mobile-first curata, con contatto rapido, mappa, servizi e richiesta diretta. Posso inviarvi il link per farvela vedere?\nPrezzo raccomandato: €900 setup + €79/mese\nFooter applicato: Tutti i diritti riservati, sito creato da Alexandru Eugen Iacovici trading as Iacovici.it",
    priority: "High",
    status: "done",
  },
  {
    id: "prospect-17",
    title: "Tutti Qui",
    description: "Categoria/Città: Ristorante / trattoria · Asti\nGoogle Maps: https://www.google.com/maps/search/?api=1&query=44.8962582,8.2069474\nTelefono: +39 0141 1766002\nSito preparato: https://vindepemarte.github.io/client-1-tutti-qui/\nRepo GitHub: https://github.com/vindepemarte/client-1-tutti-qui\nPerché selezionato: telefono presente, nessun sito ufficiale evidente nelle fonti OSM; opportunità mobile-first. prenotazioni e richieste perse quando le persone cercano menu, orari e contatto rapido dal telefono\nCompetitor con presenza web: L’Antico Casale Asti (https://anticocasaleasti.it/); La Regibussa (https://www.laregibussa.it/)\nScript primo messaggio: Buongiorno, sono Alexandru. Ho preparato una proposta concreta per Tutti Qui: una pagina mobile-first curata, con contatto rapido, mappa, servizi e richiesta diretta. Posso inviarvi il link per farvela vedere?\nPrezzo raccomandato: €1.200 setup + €99/mese\nFooter applicato: Tutti i diritti riservati, sito creato da Alexandru Eugen Iacovici trading as Iacovici.it",
    priority: "High",
    status: "done",
  },
  {
    id: "prospect-18",
    title: "Il bello delle donne",
    description: "Categoria/Città: Parrucchiere / salone · Asti\nGoogle Maps: https://www.google.com/maps/search/?api=1&query=44.9034018,8.2157853\nTelefono: +39 0141 556285\nSito preparato: https://vindepemarte.github.io/client-1-il-bello-delle-donne/\nRepo GitHub: https://github.com/vindepemarte/client-1-il-bello-delle-donne\nPerché selezionato: telefono presente, nessun sito ufficiale evidente nelle fonti OSM; opportunità mobile-first. appuntamenti persi quando clienti cercano foto, servizi e disponibilità ma trovano solo schede o social non aggiornati\nCompetitor con presenza web: Salone competitor online (https://www.google.com/search?q=parrucchiere+sito+ufficiale+Piemonte); Parrucchiere con booking online (https://www.google.com/search?q=salone+parrucchiere+prenotazione+online+Piemonte)\nScript primo messaggio: Buongiorno, sono Alexandru. Ho preparato una proposta concreta per Il bello delle donne: una pagina mobile-first curata, con contatto rapido, mappa, servizi e richiesta diretta. Posso inviarvi il link per farvela vedere?\nPrezzo raccomandato: €1.000 setup + €89/mese\nFooter applicato: Tutti i diritti riservati, sito creato da Alexandru Eugen Iacovici trading as Iacovici.it",
    priority: "High",
    status: "done",
  },
  {
    id: "prospect-19",
    title: "Emanuela Acconciature",
    description: "Categoria/Città: Parrucchiere / salone · Asti\nGoogle Maps: https://www.google.com/maps/search/?api=1&query=44.9015957,8.1996743\nTelefono: +39 0141 592 173\nSito preparato: https://vindepemarte.github.io/client-1-emanuela-acconciature/\nRepo GitHub: https://github.com/vindepemarte/client-1-emanuela-acconciature\nPerché selezionato: telefono presente, nessun sito ufficiale evidente nelle fonti OSM; opportunità mobile-first. appuntamenti persi quando clienti cercano foto, servizi e disponibilità ma trovano solo schede o social non aggiornati\nCompetitor con presenza web: Salone competitor online (https://www.google.com/search?q=parrucchiere+sito+ufficiale+Piemonte); Parrucchiere con booking online (https://www.google.com/search?q=salone+parrucchiere+prenotazione+online+Piemonte)\nScript primo messaggio: Buongiorno, sono Alexandru. Ho preparato una proposta concreta per Emanuela Acconciature: una pagina mobile-first curata, con contatto rapido, mappa, servizi e richiesta diretta. Posso inviarvi il link per farvela vedere?\nPrezzo raccomandato: €1.000 setup + €89/mese\nFooter applicato: Tutti i diritti riservati, sito creato da Alexandru Eugen Iacovici trading as Iacovici.it",
    priority: "High",
    status: "done",
  },
  {
    id: "prospect-20",
    title: "Immagine Donna",
    description: "Categoria/Città: Parrucchiere / salone · Asti\nGoogle Maps: https://www.google.com/maps/search/?api=1&query=44.8586196,8.1594969\nTelefono: +39 338 4494318\nSito preparato: https://vindepemarte.github.io/client-1-immagine-donna/\nRepo GitHub: https://github.com/vindepemarte/client-1-immagine-donna\nPerché selezionato: telefono presente, nessun sito ufficiale evidente nelle fonti OSM; opportunità mobile-first. appuntamenti persi quando clienti cercano foto, servizi e disponibilità ma trovano solo schede o social non aggiornati\nCompetitor con presenza web: Salone competitor online (https://www.google.com/search?q=parrucchiere+sito+ufficiale+Piemonte); Parrucchiere con booking online (https://www.google.com/search?q=salone+parrucchiere+prenotazione+online+Piemonte)\nScript primo messaggio: Buongiorno, sono Alexandru. Ho preparato una proposta concreta per Immagine Donna: una pagina mobile-first curata, con contatto rapido, mappa, servizi e richiesta diretta. Posso inviarvi il link per farvela vedere?\nPrezzo raccomandato: €1.000 setup + €89/mese\nFooter applicato: Tutti i diritti riservati, sito creato da Alexandru Eugen Iacovici trading as Iacovici.it",
    priority: "High",
    status: "done",
  }
];

const seededTasks: Task[] = prospectPipelineTasks;

const emptyFormState: TaskFormState = {
  title: "",
  description: "",
  priority: "Medium",
};

function isTaskPriority(value: unknown): value is TaskPriority {
  return value === "Low" || value === "Medium" || value === "High";
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return value === "todo" || value === "in-progress" || value === "done";
}

function isTask(value: unknown): value is Task {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.description === "string" &&
    isTaskPriority(candidate.priority) &&
    isTaskStatus(candidate.status)
  );
}

function readStoredTasks(): Task[] {
  if (typeof window === "undefined") {
    return seededTasks;
  }

  try {
    const rawTasks = localStorage.getItem(STORAGE_KEY);
    if (!rawTasks) {
      return seededTasks;
    }

    const parsedTasks: unknown = JSON.parse(rawTasks);
    return Array.isArray(parsedTasks) && parsedTasks.every(isTask)
      ? parsedTasks
      : seededTasks;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return seededTasks;
  }
}

export default function KanbanBoard() {
  const [formState, setFormState] = useState<TaskFormState>(emptyFormState);
  const [tasks, setTasks] = useState<Task[]>(() => readStoredTasks());

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setTasks(readStoredTasks());
      }
    };

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const writeTasks = (nextTasks: Task[]) => {
    setTasks(nextTasks);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTasks));
    } catch {
      // The board should keep working even if browser storage is unavailable.
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === "done").length;
  const tasksByColumn = columns.map((column) => ({
    ...column,
    tasks: tasks.filter((task) => task.status === column.status),
  }));

  const createTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = formState.title.trim();
    const description = formState.description.trim();

    if (!title || !description) {
      return;
    }

    const nextTask: Task = {
      id: crypto.randomUUID(),
      title,
      description,
      priority: formState.priority,
      status: "todo",
    };

    writeTasks([nextTask, ...tasks]);
    setFormState(emptyFormState);
  };

  const moveTask = (taskId: string, direction: -1 | 1) => {
    writeTasks(
      tasks.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        const currentColumnIndex = columns.findIndex(
          (column) => column.status === task.status,
        );
        const nextColumn = columns[currentColumnIndex + direction];

        return nextColumn ? { ...task, status: nextColumn.status } : task;
      }),
    );
  };

  const deleteTask = (taskId: string) => {
    writeTasks(tasks.filter((task) => task.id !== taskId));
  };

  const loadProspectPipeline = () => {
    const existingIds = new Set(tasks.map((task) => task.id));
    const missingProspects = prospectPipelineTasks.filter((task) => !existingIds.has(task.id));
    writeTasks([...missingProspects, ...tasks]);
  };

  const resetProspectPipeline = () => {
    writeTasks(prospectPipelineTasks);
  };

  return (
    <main className="min-h-screen px-4 py-6 text-slate-900 sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="glass-panel overflow-hidden rounded-[2rem] border border-white/60 p-6 sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-slate-50 uppercase">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                my-task-hermes-app
              </div>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Pipeline 20 prospect locali Italia
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Board aggiornata con 20 prospect: ricerca, demo Vercel production-ready, repo GitHub, pitch e prezzi raccomandati. Le card includono link demo, fonti, telefono, proposta commerciale e footer legale richiesto.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadProspectPipeline}
                className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Carica pipeline prospect
              </button>
              <button
                type="button"
                onClick={resetProspectPipeline}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
              >
                Reset pipeline 20 prospect
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[28rem]">
              <StatCard
                label="Total tasks"
                value={String(totalTasks)}
                note="Across all columns"
              />
              <StatCard
                label="Completed"
                value={String(completedTasks)}
                note="Tasks in Done"
              />
              <StatCard
                label="Storage"
                value="Synced"
                note="Saved in this browser"
              />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <aside className="glass-panel rounded-[2rem] border border-white/60 p-5 sm:p-6">
            <div className="mb-5">
              <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
                New task
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Add work to the queue
              </h2>
            </div>

            <form className="space-y-4" onSubmit={createTask}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Title
                </span>
                <input
                  value={formState.title}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Prepare stakeholder update"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  maxLength={80}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </span>
                <textarea
                  value={formState.description}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Summarize what needs to happen next."
                  rows={5}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  maxLength={220}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Priority
                </span>
                <select
                  value={formState.priority}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      priority: event.target.value as TaskPriority,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </label>

              <button
                type="submit"
                className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
              >
                Add task to Todo
              </button>
            </form>
          </aside>

          <section className="grid gap-4 lg:grid-cols-3">
            {tasksByColumn.map((column) => (
              <section
                key={column.status}
                className="glass-panel rounded-[2rem] border border-white/60 p-4 sm:p-5"
              >
                <header className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${column.accent}`} />
                    <div>
                      <h2 className="text-lg font-semibold text-slate-950">
                        {column.label}
                      </h2>
                      <p className="text-sm text-slate-500">
                        {column.tasks.length} task
                        {column.tasks.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                </header>

                <div className="space-y-3">
                  {column.tasks.length > 0 ? (
                    column.tasks.map((task) => {
                      const columnIndex = columns.findIndex(
                        (item) => item.status === column.status,
                      );
                      const canMoveLeft = columnIndex > 0;
                      const canMoveRight = columnIndex < columns.length - 1;

                      return (
                        <article
                          key={task.id}
                          className="board-card rounded-[1.5rem] border border-slate-200/80 p-4 transition hover:-translate-y-0.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[task.priority]}`}
                              >
                                {task.priority} priority
                              </span>
                              <h3 className="mt-3 text-base font-semibold text-slate-950">
                                {task.title}
                              </h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteTask(task.id)}
                              className="rounded-full border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                              aria-label={`Delete ${task.title}`}
                            >
                              Delete
                            </button>
                          </div>

                          <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-slate-600">
                            {task.description}
                          </p>

                          <div className="mt-4 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => moveTask(task.id, -1)}
                              disabled={!canMoveLeft}
                              className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              ← Back
                            </button>
                            <button
                              type="button"
                              onClick={() => moveTask(task.id, 1)}
                              disabled={!canMoveRight}
                              className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Next →
                            </button>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white/50 px-4 py-8 text-center text-sm leading-6 text-slate-500">
                      No tasks here yet. Move work in or create a new task.
                    </div>
                  )}
                </div>
              </section>
            ))}
          </section>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/70 bg-white/70 p-4">
      <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{note}</p>
    </div>
  );
}
