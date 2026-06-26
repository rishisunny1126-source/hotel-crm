import ResourcePage from '../components/ui/ResourcePage';
export default function Corporate() {
  return (
    <ResourcePage title="Corporate Bookings" subtitle="Company accounts" endpoint="/corporate-bookings"
      writeRoles={['admin','manager','corporate_coordinator']}
      filters={[{name:'status',label:'Status',options:['new','contacted','interested','confirmed','lost']}]}
      columns={[{key:'company_name',label:'Company'},{key:'contact_person',label:'Contact'},{key:'rooms_required',label:'Rooms'},{key:'status',label:'Status',badge:true}]}
      fields={[{name:'company_name',label:'Company',required:true},{name:'contact_person',label:'Contact Person'},{name:'contact_phone',label:'Phone'},{name:'contact_email',label:'Email'},{name:'rooms_required',label:'Rooms Required',type:'number'},{name:'start_date',label:'Start',type:'date'},{name:'end_date',label:'End',type:'date'},{name:'budget',label:'Budget',type:'number'}]} />
  );
}
