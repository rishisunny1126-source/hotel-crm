import ResourcePage from '../components/ui/ResourcePage';
export default function Handovers() {
  return (
    <ResourcePage title="Shift Handovers" subtitle="Cross-shift notes" endpoint="/shift-handovers"
      writeRoles={['admin','manager','front_desk','housekeeping','accounts']}
      filters={[{name:'shift',label:'Shift',options:['morning','evening','night']},{name:'priority',label:'Priority',options:['low','medium','high','urgent']}]}
      columns={[{key:'shift',label:'Shift'},{key:'note',label:'Note'},{key:'priority',label:'Priority',badge:true},{key:'handover_date',label:'Date'},{key:'completed',label:'Done'}]}
      fields={[{name:'shift',label:'Shift',type:'select',options:['morning','evening','night'],required:true},{name:'note',label:'Note',type:'textarea',required:true},{name:'priority',label:'Priority',type:'select',options:['low','medium','high','urgent']},{name:'handover_date',label:'Date',type:'date'}]} />
  );
}
