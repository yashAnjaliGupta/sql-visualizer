import ThemeToggle from "./ThemeToggle";
import logo from "../assets/logo.svg"
type HeaderProps = {
    isDarkMode: boolean;
    setIsDarkMode: (value: boolean) => void;
};

function Header({ isDarkMode, setIsDarkMode }: HeaderProps) {
    return(
        <div className="w-full h-20 px-6 flex items-center justify-between rounded-3xl bg-[var(--surface)]/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <div className="flex items-center gap-4">
                {/* LOGO */}
                <div className=" w-18 h-18 rounded-2xl flex items-center justify-center bg-gradient-to-br" >
                    <img src={logo} alt="SQL Visualizer" className="w-18 h-18 object-contain"/>
                </div>
                {/* TITLE */}
                <div>
                    <h1 className=" text-2xl font-bold tracking-tight text-[var(--text)]" >
                        SQL Visualizer
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                        Query Relationship Explorer
                    </p>
                </div>
            </div>
            <ThemeToggle 
                isDark={isDarkMode} 
                onToggle={() => setIsDarkMode(!isDarkMode)} 
            />
            
        </div>
    )
}
export default Header;