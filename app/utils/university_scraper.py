from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
import time
from bs4 import BeautifulSoup

def get_study_plan_sima(username, password):
    service = service = Service(r'C:\Users\ayola\Desktop\gestion_tiempoia2\chromedriver.exe') # Ajusta la ruta si es necesario
    driver = webdriver.Chrome(service=service)
    driver.get("https://sima.unicartagena.edu.co/my/")

 
    time.sleep(2)
    driver.find_element(By.ID, "username").send_keys(username)
    driver.find_element(By.ID, "password").send_keys(password)
    driver.find_element(By.ID, "loginbtn").click()

    time.sleep(5)

    # Ir directamente al calendario mensual
    driver.get("https://sima.unicartagena.edu.co/calendar/view.php?view=month")
    time.sleep(5)

    html = driver.page_source
    soup = BeautifulSoup(html, 'html.parser')

    # Extraer mes y año
    mes_ano = ""
    h4 = soup.find('h4', class_='current')
    if h4:
        mes_ano = h4.get_text(strip=True).lower()  # Guardar en minúsculas

    eventos = []
    for td in soup.find_all('td', class_='day'):
        day_number = td.find('span', class_='day-number')
        if not day_number:
            continue
        dia = day_number.get_text(strip=True)

        ul = td.find('ul')
        if not ul:
            continue
        for li in ul.find_all('li', attrs={'data-region': 'event-item'}):
            a = li.find('a', attrs={'data-action': 'view-event'})
            if a:
                nombre = a.find('span', class_='eventname').get_text(strip=True)
                url = a['href']

                # --- Scraping adicional: entrar al enlace del evento ---
                driver.execute_script("window.open('');")
                driver.switch_to.window(driver.window_handles[1])
                driver.get(url)
                time.sleep(2)
                event_html = driver.page_source
                event_soup = BeautifulSoup(event_html, 'html.parser')
                # Intenta encontrar el nombre del curso en el breadcrumb
                curso_nombre = None
                breadcrumb = event_soup.find('nav', {'aria-label': 'Ruta de navegación'})
                if breadcrumb:
                    items = breadcrumb.find_all('li')
                    if len(items) > 1:
                        curso_nombre = items[1].get_text(strip=True)
                # Si no lo encuentra, intenta en el título
                if not curso_nombre:
                    h1 = event_soup.find('h1')
                    if h1:
                        curso_nombre = h1.get_text(strip=True)
                driver.close()
                driver.switch_to.window(driver.window_handles[0])
                # ------------------------------------------------------

                eventos.append({
                    'nombre': nombre,
                    'url': url,
                    'dia': dia,
                    'mes_ano': mes_ano,
                    'curso_nombre': curso_nombre or "Desconocido"
                })

    driver.quit()
    return eventos