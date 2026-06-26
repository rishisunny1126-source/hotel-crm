import ResourcePage from '../components/ui/ResourcePage';
export default function Rooms() {
  return (
    <ResourcePage title="Rooms" subtitle="Inventory & status" endpoint="/rooms"
      writeRoles={['admin','manager']}
      filters={[{name:'status',label:'Status',options:['available','reserved','occupied','cleaning','maintenance']},{name:'room_type',label:'Type',options:['Economy','Deluxe','Suite','Business Lounge']}]}
      columns={[{key:'room_number',label:'Room'},{key:'room_type',label:'Type'},{key:'capacity',label:'Cap'},{key:'rate',label:'Rate'},{key:'status',label:'Status',badge:true},{key:'hk_status',label:'HK',badge:true}]}
      fields={[{name:'room_number',label:'Room Number',required:true},{name:'room_type',label:'Type',type:'select',options:['Economy','Deluxe','Suite','Business Lounge'],required:true},{name:'capacity',label:'Capacity',type:'number',required:true},{name:'rate',label:'Rate',type:'number',required:true},{name:'floor',label:'Floor',type:'number'},{name:'status',label:'Status',type:'select',options:['available','reserved','occupied','cleaning','maintenance']}]} />
  );
}
