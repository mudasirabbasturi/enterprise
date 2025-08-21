import { useForm } from "@inertiajs/react";

const Profile = ({ id }) => {
  const { data, setData, post, progress } = useForm({
    name: null,
    avatar: null,
  });
  function submit(e) {
    e.preventDefault();
    put("/user/profile/upload/", id);
  }
  return (
    <>
      <form onSubmit={submit}>
        <input
          type="text"
          value={data.name}
          onChange={(e) => setData("name", e.target.value)}
        />
        <input
          type="file"
          onChange={(e) => setData("avatar", e.target.files[0])}
        />
        {progress && (
          <progress value={progress.percentage} max="100">
            {progress.percentage}%
          </progress>
        )}
        <button type="submit">Submit</button>
      </form>
    </>
  );
};
export default Profile;
