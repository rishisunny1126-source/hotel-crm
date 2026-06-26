import ResourcePage from '../components/ui/ResourcePage';
export default function RoomService() {
  return (
    <ResourcePage title="Room Service Requests" subtitle="Track service tasks" endpoint="/room-service"
      writeRoles={['admin','manager','front_desk','housekeeping']}
      filters={[{name:'status',label:'Status',options:['requested','assigned','in_progress','completed','cancelled']},{name:'service_type',label:'Type',options:['food','laundry','extra_towel','extra_bed','cleaning','other']}]}
      columns={[{key:'service_type',label:'Service'},{key:'description',label:'Description'},{key:'status',label:'Status',badge:true}]}
      fields={[{name:'room_id',label:'Room ID (UUID)',required:true},{name:'service_type',label:'Type',type:'select',options:['food','laundry','extra_towel','extra_bed','cleaning','other'],required:true},{name:'description',label:'Description',type:'textarea'},{name:'status',label:'Status',type:'select',options:['requested','assigned','in_progress','completed','cancelled']}]} />
  );
}
