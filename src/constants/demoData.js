import { GROUP_OPTIONS, MENU_OPTIONS } from './options';

const randomItem = (list, index) => list[index % list.length];

export const buildDemoData = () => {
  const tables = Array.from({ length: 5 }).map((_, idx) => ({
    id: `table-${idx + 1}`,
    number: idx + 1,
    seats: idx % 2 === 0 ? 8 : 10,
    notes: '',
  }));

  const names = [
    'Maria Popescu', 'Andrei Ionescu', 'Elena Dumitru', 'Radu Pavel', 'Ioana Marinescu',
    'Mihai Stancu', 'Ana Georgescu', 'Cristian Dobre', 'Diana Tudor', 'Victor Rusu',
    'Claudia Ene', 'Paul Munteanu', 'Teodora Nica', 'Alex Bălan', 'Gabriela Stan',
    'Robert Matei', 'Simona Ilie', 'Dan Preda', 'Bianca Neagu', 'Sorin Lupu',
  ];

  const guests = names.map((name, idx) => ({
    id: `guest-${idx + 1}`,
    name,
    group: randomItem(GROUP_OPTIONS, idx),
    menu: randomItem(MENU_OPTIONS, idx),
    notes: idx % 5 === 0 ? 'Preferă loc aproape de scenă' : '',
    status: idx % 4 === 0 ? 'unconfirmed' : 'confirmed',
    tableId: idx < 12 ? tables[idx % tables.length].id : null,
  }));

  return {
    name: 'Gala de Primăvară',
    tables,
    guests,
  };
};
