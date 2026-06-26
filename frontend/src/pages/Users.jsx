import ResourcePage from '../components/ui/ResourcePage';
export default function Users() {
  return (
    <ResourcePage title="Users" subtitle="Staff accounts & roles" endpoint="/users"
      writeRoles={['admin']}
      filters={[{name:'role',label:'Role',options:['admin','manager','front_desk','housekeeping','accounts','corporate_coordinator']}]}
      columns={[{key:'name',label:'Name'},{key:'email',label:'Email'},{key:'role',label:'Role',badge:true},{key:'is_active',label:'Active'}]}
      fields={[{name:'name',label:'Name',required:true},{name:'email',label:'Email',required:true},{name:'phone',label:'Phone'},{name:'role',label:'Role',type:'select',options:['admin','manager','front_desk','housekeeping','accounts','corporate_coordinator'],required:true}]} />
  );
}
