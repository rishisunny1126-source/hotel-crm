import ResourcePage from '../components/ui/ResourcePage';
export default function FollowUps() {
  return (
    <ResourcePage title="Follow-Ups" subtitle="Scheduled guest follow-ups" endpoint="/follow-ups"
      writeRoles={['admin','manager','front_desk','corporate_coordinator']}
      filters={[{name:'status',label:'Status',options:['pending','completed','overdue','cancelled']},{name:'priority',label:'Priority',options:['low','medium','high','urgent']}]}
      columns={[{key:'guest_name',label:'Guest'},{key:'mobile',label:'Mobile'},{key:'scheduled_date',label:'Date'},{key:'priority',label:'Priority',badge:true},{key:'status',label:'Status',badge:true},{key:'notes',label:'Notes'}]}
      fields={[{name:'enquiry_id',label:'Enquiry ID (UUID)',required:true},{name:'scheduled_date',label:'Date',type:'date',required:true},{name:'scheduled_time',label:'Time',type:'time'},{name:'priority',label:'Priority',type:'select',options:['low','medium','high','urgent']},{name:'notes',label:'Notes',type:'textarea'}]} />
  );
}
