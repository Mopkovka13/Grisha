import { useEffect, useState } from 'react'
import { serviceApi, ServiceResponse } from '../../api/serviceApi'
import styles from './Services.module.css'

function Services() {
  const [services, setServices] = useState<ServiceResponse[]>([])

  useEffect(() => {
    serviceApi.getServices().then(setServices).catch(() => {})
  }, [])

  if (services.length === 0) return null

  return (
    <section id="services" className={styles.services}>
      <p className={styles.label}>Услуги и цены</p>
      <div className={styles.list}>
        {services.map((service, i) => (
          <div key={service.id} className={styles.row}>
            <span className={styles.index}>0{i + 1}</span>
            <div className={styles.body}>
              <h3 className={styles.title}>{service.title}</h3>
              {service.description && (
                <p className={styles.description}>{service.description}</p>
              )}
            </div>
            {service.price && (
              <span className={styles.price}>{service.price}</span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export default Services
