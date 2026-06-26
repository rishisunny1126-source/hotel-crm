import ResourcePage from '../components/ui/ResourcePage';
export default function Housekeeping() {
  return (
    <ResourcePage title="Housekeeping" subtitle="Room cleaning queue" endpoint="/housekeeping"
      writeRoles={['admin','manager','housekeeping']}
      filters={[{name:'status',label:'Status',options:['dirty','cleaning','ready','occupied']}]}
      columns={[{key:'room_id',label:'Room ID'},{key:'status',label:'Status',badge:true},{key:'notes',label:'Notes'}]}
      fields={[{name:'room_id',label:'Room ID (UUID)',required:true},{name:'status',label:'Status',type:'select',options:['dirty','cleaning','ready','occupied'],required:true},{name:'notes',label:'Notes',type:'textarea'}]} />
  );
}
