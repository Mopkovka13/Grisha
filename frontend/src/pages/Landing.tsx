import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'
import Header from '../components/Header/Header'
import Hero from '../components/Hero/Hero'
import Portfolio from '../components/Portfolio/Portfolio'
import Services from '../components/Services/Services'
import Contacts from '../components/Contacts/Contacts'
import styles from '../App.module.css'

function Landing() {
  return (
    <SimpleBar style={{ height: '100vh' }}>
      <div className={styles.app}>
        <Header />
        <Hero />
        <Portfolio />
        <Services />
        <Contacts />
      </div>
    </SimpleBar>
  )
}

export default Landing
