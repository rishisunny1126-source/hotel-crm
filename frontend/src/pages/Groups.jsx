import ResourcePage from '../components/ui/ResourcePage';
export default function Groups() {
  return (
    <ResourcePage title="Group Bookings" subtitle="Tour & event groups" endpoint="/group-bookings"
      writeRoles={['admin','manager','corporate_coordinator']}
      columns={[{key:'group_name',label:'Group'},{key:'guests_count',label:'Guests'},{key:'rooms_count',label:'Rooms'},{key:'arrival_date',label:'Arrival'},{key:'status',label:'Status',badge:true}]}
      fields={[{name:'group_name',label:'Group Name',required:true},{name:'guests_count',label:'Guests',type:'number'},{name:'rooms_count',label:'Rooms',type:'number'},{name:'arrival_date',label:'Arrival',type:'date'},{name:'departure_date',label:'Departure',type:'date'},{name:'contact_person',label:'Contact'},{name:'contact_phone',label:'Phone'}]} />
  );
}
