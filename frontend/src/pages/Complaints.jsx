import ResourcePage from '../components/ui/ResourcePage';
export default function Complaints() {
  return (
    <ResourcePage title="Complaints" subtitle="Track & resolve complaints" endpoint="/complaints"
      writeRoles={['admin','manager','front_desk']}
      filters={[{name:'status',label:'Status',options:['open','in_progress','resolved','closed']},{name:'priority',label:'Priority',options:['low','medium','high','urgent']}]}
      columns={[{key:'title',label:'Title'},{key:'priority',label:'Priority',badge:true},{key:'status',label:'Status',badge:true},{key:'created_at',label:'Created'}]}
      fields={[{name:'title',label:'Title',required:true},{name:'description',label:'Description',type:'textarea'},{name:'priority',label:'Priority',type:'select',options:['low','medium','high','urgent']},{name:'status',label:'Status',type:'select',options:['open','in_progress','resolved','closed']}]} />
  );
}
