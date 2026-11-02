import { DEMO_USERS, findDemoUser, type DemoUser } from "@/lib/demo-users";

type UserSelectorProps = {
  user: DemoUser;
  onChange: (user: DemoUser) => void;
  disabled?: boolean;
};

export function UserSelector({ user, onChange, disabled = false }: UserSelectorProps) {
  return (
    <div className="user-selector">
      <span className={`avatar avatar--${user.handle}`} aria-hidden="true">{user.initials}</span>
      <div>
        <label htmlFor="demo-user">Demo user</label>
        <select
          id="demo-user"
          value={user.handle}
          disabled={disabled}
          aria-describedby="demo-explanation"
          onChange={(event) => {
            const selected = findDemoUser(event.target.value);
            if (selected) onChange(selected);
          }}
        >
          {DEMO_USERS.map((demoUser) => (
            <option key={demoUser.id} value={demoUser.handle}>{demoUser.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
