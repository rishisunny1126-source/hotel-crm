import ResourcePage from '../components/ui/ResourcePage';
export default function Guests() {
  return (
    <ResourcePage title="Guests / Loyalty" subtitle="Guest master & loyalty profiles" endpoint="/guests"
      writeRoles={['admin','manager','front_desk']}
      filters={[{name:'loyalty_tier',label:'Tier',options:['standard','silver','gold','platinum']}]}
      columns={[{key:'name',label:'Name'},{key:'mobile',label:'Mobile'},{key:'city',label:'City'},{key:'total_stays',label:'Stays'},{key:'lifetime_value',label:'LTV'},{key:'loyalty_tier',label:'Tier',badge:true}]}
      fields={[{name:'name',label:'Name',required:true},{name:'mobile',label:'Mobile',required:true},{name:'email',label:'Email'},{name:'city',label:'City'},{name:'preferred_room_type',label:'Preferred Room'},{name:'preferred_services',label:'Preferred Services'},{name:'loyalty_tier',label:'Tier',type:'select',options:['standard','silver','gold','platinum']}]} />
  );
}
