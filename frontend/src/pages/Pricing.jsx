import ResourcePage from '../components/ui/ResourcePage';
export default function Pricing() {
  return (
    <ResourcePage title="Seasonal Pricing" subtitle="Rate plans applied automatically at booking" endpoint="/rate-plans"
      writeRoles={['admin','manager']}
      filters={[{name:'room_type',label:'Type',options:['Economy','Deluxe','Suite','Business Lounge']},{name:'is_active',label:'Active',options:['true','false']}]}
      columns={[{key:'name',label:'Plan'},{key:'room_type',label:'Type'},{key:'start_date',label:'From'},{key:'end_date',label:'To'},{key:'rate',label:'Rate'},{key:'priority',label:'Priority'},{key:'is_active',label:'Active'}]}
      fields={[
        {name:'name',label:'Plan Name',required:true},
        {name:'room_type',label:'Room Type',type:'select',options:['Economy','Deluxe','Suite','Business Lounge'],required:true},
        {name:'start_date',label:'Start Date',type:'date',required:true},
        {name:'end_date',label:'End Date',type:'date',required:true},
        {name:'rate',label:'Nightly Rate',type:'number',required:true},
        {name:'priority',label:'Priority (higher wins)',type:'number'},
        {name:'is_active',label:'Active',type:'select',options:['true','false']},
      ]} />
  );
}
